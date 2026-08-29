jest.mock('../../../models/user', () => ({ authenticate: jest.fn(), findOne: jest.fn(), updateOne: jest.fn() }))
jest.mock('../../../services/passkey', () => ({
  authenticationOptions: jest.fn(),
  verifyAuthentication: jest.fn()
}))
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/isAdmin', () => (req, res, next) => next())

const request = require('supertest')
const user = require('../../../models/user')
const passkey = require('../../../services/passkey')
const writeLog = require('../../../services/writeLog')
const users = require('../../../api/v1/users')
const { buildApp: build, query } = require('../helpers')

const buildApp = () => build('/users', users, { cookie: {}, destroy: jest.fn(cb => cb()) })

const authenticateResolves = account => {
  user.authenticate.mockImplementation((username, password, cb) => cb(null, account))
}
const authenticateFails = error => {
  user.authenticate.mockImplementation((username, password, cb) => cb(error, null))
}

const account = { _id: 'user-1', username: 'oscar', admin: true }
const credential = { credentialID: 'cred-1', publicKey: 'key', counter: 4 }
const passkeyAccount = { ...account, credentials: [credential] }

const findOneResolves = value => user.findOne.mockReturnValue(query(value))

beforeEach(() => {
  user.authenticate.mockReset()
  user.findOne.mockReset()
  user.updateOne.mockReset().mockResolvedValue({})
  passkey.authenticationOptions.mockReset()
  passkey.verifyAuthentication.mockReset()
  writeLog.mockReset()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('POST /users/login validation', () => {
  it('rejects a request with no username', async () => {
    const { app } = buildApp()
    const res = await request(app).post('/users/login').send({ password: 'secret' })

    expect(res.status).toBe(403)
    expect(user.authenticate).not.toHaveBeenCalled()
  })

  it('rejects a request with no password', async () => {
    const { app } = buildApp()
    const res = await request(app).post('/users/login').send({ username: 'oscar' })

    expect(res.status).toBe(403)
    expect(user.authenticate).not.toHaveBeenCalled()
  })

  it('rejects a username that is not a string', async () => {
    const { app } = buildApp()

    const res = await request(app).post('/users/login').send({ username: { $ne: null }, password: 'secret' })

    expect(res.status).toBe(403)
    expect(user.authenticate).not.toHaveBeenCalled()
  })

  it('rejects an empty body without touching the session', async () => {
    const { app, session } = buildApp()
    const res = await request(app).post('/users/login').send({})

    expect(res.status).toBe(403)
    expect(session.userId).toBe(undefined)
  })
})

describe('POST /users/login credentials', () => {
  it('establishes the session on success', async () => {
    authenticateResolves(account)
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login').send({ username: 'oscar', password: 'secret', remember: true })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ admin: true, _id: 'user-1' })
    expect(session.userId).toBe('user-1')
    expect(session.admin).toBe(true)
    expect(session.username).toBe('oscar')
  })

  it('refuses bad credentials and writes nothing to the session', async () => {
    authenticateFails('Incorrect username or password')
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login').send({ username: 'oscar', password: 'wrong' })

    expect(res.status).toBe(401)
    expect(session.userId).toBe(undefined)
  })

  it('does not tell the caller why the login failed', async () => {
    // an unknown user and a wrong password must be indistinguishable
    authenticateFails(new Error('no such user: oscar'))
    const { app } = buildApp()

    const res = await request(app).post('/users/login').send({ username: 'oscar', password: 'wrong' })

    expect(res.text).toBe('Incorrect username or password')
    expect(res.text).not.toContain('no such user')
  })

  it('still records the reason server-side', async () => {
    authenticateFails(new Error('database unreachable'))
    const { app } = buildApp()
    await request(app).post('/users/login').send({ username: 'oscar', password: 'wrong' })

    const logged = writeLog.mock.calls.map(c => c[0]).join(' ')
    expect(logged).toContain('database unreachable')
  })
})

describe('POST /users/login/passkey/options', () => {
  it('hands back options and does not authenticate anyone', async () => {
    passkey.authenticationOptions.mockResolvedValue({ challenge: 'abc', allowCredentials: [] })
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login/passkey/options').send({})

    expect(res.status).toBe(200)
    expect(res.body.challenge).toBe('abc')
    expect(session.userId).toBe(undefined)
  })

  it('reports a service failure', async () => {
    passkey.authenticationOptions.mockRejectedValue(new Error('no challenge'))
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login/passkey/options').send({})

    expect(res.status).toBe(500)
    expect(session.userId).toBe(undefined)
  })
})

describe('POST /users/login/passkey', () => {
  it('rejects a body with no credential', async () => {
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login/passkey').send({})

    expect(res.status).toBe(403)
    expect(session.userId).toBe(undefined)
    expect(passkey.verifyAuthentication).not.toHaveBeenCalled()
  })

  it('refuses an operator object where the credential id belongs', async () => {
    // {"$ne": null} is truthy, so a plain presence check would have handed it
    // straight to mongo and matched whichever account came first
    findOneResolves(passkeyAccount)
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login/passkey').send({ response: { id: { $ne: null } } })

    expect(res.status).toBe(403)
    expect(user.findOne).not.toHaveBeenCalled()
    expect(session.userId).toBe(undefined)
  })

  it('refuses a credential id that is not a string', async () => {
    const { app } = buildApp()

    for (const id of [42, ['cred-1'], { credentialID: 'cred-1' }, true]) {
      const res = await request(app).post('/users/login/passkey').send({ response: { id } })
      expect(res.status).toBe(403)
    }

    expect(user.findOne).not.toHaveBeenCalled()
  })

  it('establishes the session for a verified passkey', async () => {
    findOneResolves(passkeyAccount)
    passkey.verifyAuthentication.mockResolvedValue(5)
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login/passkey').send({ response: { id: 'cred-1' }, remember: true })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ admin: true, _id: 'user-1' })
    expect(session.userId).toBe('user-1')
    expect(session.admin).toBe(true)
    expect(session.username).toBe('oscar')
  })

  it('verifies against the stored credential the response names', async () => {
    findOneResolves(passkeyAccount)
    passkey.verifyAuthentication.mockResolvedValue(5)
    const { app } = buildApp()

    await request(app).post('/users/login/passkey').send({ response: { id: 'cred-1' } })

    expect(passkey.verifyAuthentication).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'cred-1' },
      credential
    )
  })

  it('persists the new signature counter', async () => {
    findOneResolves(passkeyAccount)
    passkey.verifyAuthentication.mockResolvedValue(5)
    const { app } = buildApp()

    await request(app).post('/users/login/passkey').send({ response: { id: 'cred-1' } })

    expect(user.updateOne).toHaveBeenCalledWith(
      { _id: 'user-1', 'credentials.credentialID': 'cred-1' },
      { $set: { 'credentials.$.counter': 5 } }
    )
  })

  it('refuses a credential no account holds', async () => {
    findOneResolves(null)
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login/passkey').send({ response: { id: 'unknown' } })

    expect(res.status).toBe(401)
    expect(session.userId).toBe(undefined)
    expect(user.updateOne).not.toHaveBeenCalled()
  })

  it('refuses a passkey that fails verification', async () => {
    findOneResolves(passkeyAccount)
    passkey.verifyAuthentication.mockRejectedValue(new Error('challenge mismatch'))
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login/passkey').send({ response: { id: 'cred-1' } })

    expect(res.status).toBe(401)
    expect(session.userId).toBe(undefined)
    expect(user.updateOne).not.toHaveBeenCalled()
  })

  it('does not tell the caller why the passkey was refused', async () => {
    findOneResolves(passkeyAccount)
    passkey.verifyAuthentication.mockRejectedValue(new Error('challenge mismatch'))
    const { app } = buildApp()

    const res = await request(app).post('/users/login/passkey').send({ response: { id: 'cred-1' } })

    expect(res.text).toBe('That passkey was not accepted')
    expect(res.text).not.toContain('challenge mismatch')

    const logged = writeLog.mock.calls.map(c => c[0]).join(' ')
    expect(logged).toContain('challenge mismatch')
  })

  it('makes the cookie session-scoped when remember is not set', async () => {
    findOneResolves(passkeyAccount)
    passkey.verifyAuthentication.mockResolvedValue(5)
    const { app, session } = buildApp()

    await request(app).post('/users/login/passkey').send({ response: { id: 'cred-1' } })

    expect(session.cookie.expires).toBe(false)
  })
})

describe('POST /users/login remember me', () => {
  it('leaves the cookie alone when remember is set', async () => {
    authenticateResolves(account)
    const { app, session } = buildApp()

    await request(app).post('/users/login').send({ username: 'oscar', password: 'secret', remember: true })

    expect(session.cookie.expires).toBe(undefined)
  })

  it('makes the cookie session-scoped when remember is not set', async () => {
    authenticateResolves(account)
    const { app, session } = buildApp()

    await request(app).post('/users/login').send({ username: 'oscar', password: 'secret' })

    expect(session.cookie.expires).toBe(false)
  })
})

describe('DELETE /users/logout', () => {
  it('destroys the session and clears the cookie', async () => {
    const { app, session } = buildApp()

    const res = await request(app).delete('/users/logout')

    expect(res.status).toBe(200)
    expect(session.destroy).toHaveBeenCalled()
    expect(res.headers['set-cookie'].join(';')).toContain('connect.sid=')
  })

  it('reports a failure to destroy the session', async () => {
    const { app, session } = buildApp()
    session.destroy.mockImplementation(cb => cb(new Error('store unreachable')))

    const res = await request(app).delete('/users/logout')

    expect(res.status).toBe(500)
  })
})

describe('GET /users/preview', () => {
  const { PR, DEFAULT_USER, DEFAULT_PASS } = process.env

  afterEach(() => {
    delete process.env.PR
    delete process.env.DEFAULT_USER
    delete process.env.DEFAULT_PASS
    if (PR) process.env.PR = PR
    if (DEFAULT_USER) process.env.DEFAULT_USER = DEFAULT_USER
    if (DEFAULT_PASS) process.env.DEFAULT_PASS = DEFAULT_PASS
  })

  it('says nothing at all outside a preview namespace', async () => {
    delete process.env.PR
    process.env.DEFAULT_USER = 'oscar'
    process.env.DEFAULT_PASS = 'a-real-password'
    const { app } = buildApp()

    const res = await request(app).get('/users/preview')

    expect(res.body).toEqual({ enabled: false })
    expect(JSON.stringify(res.body)).not.toContain('a-real-password')
  })

  it('hands out the throwaway account inside one', async () => {
    process.env.PR = 'true'
    process.env.DEFAULT_USER = 'test'
    process.env.DEFAULT_PASS = 'test'
    const { app } = buildApp()

    const res = await request(app).get('/users/preview')

    expect(res.body).toEqual({ enabled: true, username: 'test', password: 'test' })
  })
})
