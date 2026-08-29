jest.mock('../../../models/user', () => ({ authenticate: jest.fn() }))
jest.mock('../../../services/otp', () => ({ check: jest.fn(), generate: jest.fn() }))
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/isAdmin', () => (req, res, next) => next())

const express = require('express')
const request = require('supertest')
const user = require('../../../models/user')
const otp = require('../../../services/otp')
const writeLog = require('../../../services/writeLog')
const users = require('../../../api/v1/users')

// a stand-in for express-session: the handler only reads and writes plain
// properties, so a bare object is enough to assert what it stores
const buildApp = () => {
  const session = { cookie: {}, destroy: jest.fn(cb => cb()) }
  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    req.session = session
    req.realIp = '203.0.113.1'
    next()
  })
  app.use('/users', users)
  return { app, session }
}

const authenticateResolves = account => {
  user.authenticate.mockImplementation((username, password, cb) => cb(null, account))
}
const authenticateFails = error => {
  user.authenticate.mockImplementation((username, password, cb) => cb(error, null))
}

const account = { _id: 'user-1', username: 'oscar', admin: true }

beforeEach(() => {
  user.authenticate.mockReset()
  otp.check.mockReset()
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

describe('POST /users/login two factor', () => {
  const otpAccount = { ...account, otp: { status: true, secret: 'SECRET' } }

  it('asks for a token without establishing a session', async () => {
    authenticateResolves(otpAccount)
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login').send({ username: 'oscar', password: 'secret' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ otp: true })
    expect(session.userId).toBe(undefined)
  })

  it('refuses a wrong token', async () => {
    authenticateResolves(otpAccount)
    otp.check.mockReturnValue(false)
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login').send({ username: 'oscar', password: 'secret', token: '000000' })

    expect(res.status).toBe(401)
    expect(session.userId).toBe(undefined)
  })

  it('accepts a correct token', async () => {
    authenticateResolves(otpAccount)
    otp.check.mockReturnValue(true)
    const { app, session } = buildApp()

    const res = await request(app).post('/users/login').send({ username: 'oscar', password: 'secret', token: '123456' })

    expect(res.status).toBe(200)
    expect(otp.check).toHaveBeenCalledWith('123456', 'SECRET')
    expect(session.userId).toBe('user-1')
  })

  it('skips the token check for an account without 2fa', async () => {
    authenticateResolves(account)
    const { app } = buildApp()

    await request(app).post('/users/login').send({ username: 'oscar', password: 'secret' })

    expect(otp.check).not.toHaveBeenCalled()
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
