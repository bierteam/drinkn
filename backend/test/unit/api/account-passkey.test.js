jest.mock('../../../models/user', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }))
jest.mock('../../../services/passkey', () => ({
  registrationOptions: jest.fn(),
  verifyRegistration: jest.fn()
}))
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/isAuthenticated', () => (req, res, next) => next())

const request = require('supertest')
const user = require('../../../models/user')
const passkey = require('../../../services/passkey')
const writeLog = require('../../../services/writeLog')
const account = require('../../../api/v1/account')
const { buildApp: build, selected, selectedRejecting } = require('../helpers')

const buildApp = () => build('/account', account, { userId: 'user-1', username: 'oscar' })

// both mongoose calls in this router end .select(...).exec()
const findOneResolves = value => user.findOne.mockReturnValue(selected(value))
const findOneAndUpdateResolves = value => user.findOneAndUpdate.mockReturnValue(selected(value))
const findOneAndUpdateRejects = error => user.findOneAndUpdate.mockReturnValue(selectedRejecting(error))

const storedAccount = { _id: 'user-1', username: 'oscar', credentials: [] }
const verifiedCredential = {
  credentialID: 'cred-1',
  publicKey: 'AQI',
  counter: 0,
  transports: ['internal']
}

beforeEach(() => {
  user.findOne.mockReset()
  user.findOneAndUpdate.mockReset()
  passkey.registrationOptions.mockReset()
  passkey.verifyRegistration.mockReset()
  writeLog.mockReset()
  findOneResolves(storedAccount)
  findOneAndUpdateResolves({ username: 'oscar', credentials: [] })
})

describe('POST /account/passkey/options', () => {
  it('hands back the options the service generated', async () => {
    passkey.registrationOptions.mockResolvedValue({ challenge: 'abc', rp: { id: 'localhost' } })
    const { app } = buildApp()

    const res = await request(app).post('/account/passkey/options').send({})

    expect(res.status).toBe(200)
    expect(res.body.challenge).toBe('abc')
  })

  it('builds the options from the signed-in account', async () => {
    passkey.registrationOptions.mockResolvedValue({ challenge: 'abc' })
    const { app } = buildApp()

    await request(app).post('/account/passkey/options').send({})

    expect(user.findOne).toHaveBeenCalledWith({ _id: 'user-1' })
    expect(passkey.registrationOptions).toHaveBeenCalledWith(expect.anything(), storedAccount, undefined)
  })

  it('passes on the kind of authenticator that was asked for', async () => {
    passkey.registrationOptions.mockResolvedValue({ challenge: 'abc' })
    const { app } = buildApp()

    await request(app).post('/account/passkey/options').send({ attachment: 'cross-platform' })

    expect(passkey.registrationOptions).toHaveBeenCalledWith(expect.anything(), storedAccount, 'cross-platform')
  })

  it('refuses when the session points at an account that is gone', async () => {
    findOneResolves(null)
    const { app } = buildApp()

    const res = await request(app).post('/account/passkey/options').send({})

    expect(res.status).toBe(401)
    expect(passkey.registrationOptions).not.toHaveBeenCalled()
  })

  it('reports a service failure', async () => {
    passkey.registrationOptions.mockRejectedValue(new Error('no challenge'))
    const { app } = buildApp()

    const res = await request(app).post('/account/passkey/options').send({})

    expect(res.status).toBe(500)
  })
})

describe('POST /account/passkey', () => {
  it('stores the verified credential against the account', async () => {
    passkey.verifyRegistration.mockResolvedValue({ ...verifiedCredential })
    findOneAndUpdateResolves({ username: 'oscar', credentials: [{ credentialID: 'cred-1' }] })
    const { app } = buildApp()

    const res = await request(app).post('/account/passkey').send({
      response: { id: 'cred-1' },
      name: 'Laptop'
    })

    expect(res.status).toBe(200)
    expect(user.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user-1' },
      { $push: { credentials: { ...verifiedCredential, name: 'Laptop' } } },
      { new: true }
    )
  })

  it('verifies the response the browser sent', async () => {
    passkey.verifyRegistration.mockResolvedValue({ ...verifiedCredential })
    const { app } = buildApp()

    await request(app).post('/account/passkey').send({ response: { id: 'cred-1' } })

    expect(passkey.verifyRegistration).toHaveBeenCalledWith(expect.anything(), { id: 'cred-1' })
  })

  it('names an unnamed credential rather than storing nothing', async () => {
    passkey.verifyRegistration.mockResolvedValue({ ...verifiedCredential })
    const { app } = buildApp()

    await request(app).post('/account/passkey').send({ response: { id: 'cred-1' } })

    expect(user.findOneAndUpdate.mock.calls[0][1].$push.credentials.name).toBe('Passkey')
  })

  it('coerces a name that is not a string', async () => {
    passkey.verifyRegistration.mockResolvedValue({ ...verifiedCredential })
    const { app } = buildApp()

    await request(app).post('/account/passkey').send({ response: { id: 'cred-1' }, name: 12345 })

    expect(user.findOneAndUpdate.mock.calls[0][1].$push.credentials.name).toBe('12345')
  })

  it('rejects a credential that fails verification without writing', async () => {
    passkey.verifyRegistration.mockRejectedValue(new Error('challenge mismatch'))
    const { app } = buildApp()

    const res = await request(app).post('/account/passkey').send({ response: { id: 'cred-1' } })

    expect(res.status).toBe(400)
    expect(user.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('keeps the reason for a refusal server-side', async () => {
    passkey.verifyRegistration.mockRejectedValue(new Error('challenge mismatch'))
    const { app } = buildApp()

    const res = await request(app).post('/account/passkey').send({ response: { id: 'cred-1' } })

    expect(res.text).toBe('That passkey could not be registered, try again.')
    expect(res.text).not.toContain('challenge mismatch')

    const logged = writeLog.mock.calls.map(c => c[0]).join(' ')
    expect(logged).toContain('challenge mismatch')
  })

  it('reports a failed write', async () => {
    passkey.verifyRegistration.mockResolvedValue({ ...verifiedCredential })
    findOneAndUpdateRejects(new Error('store unreachable'))
    const { app } = buildApp()

    const res = await request(app).post('/account/passkey').send({ response: { id: 'cred-1' } })

    expect(res.status).toBe(500)
  })
})

describe('DELETE /account/passkey/:credentialID', () => {
  it('pulls the named credential and returns the list that is left', async () => {
    findOneAndUpdateResolves({ username: 'oscar', credentials: [] })
    const { app } = buildApp()

    const res = await request(app).delete('/account/passkey/cred-1')

    expect(res.status).toBe(200)
    expect(res.body.credentials).toEqual([])
    expect(user.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user-1' },
      { $pull: { credentials: { credentialID: 'cred-1' } } },
      { new: true }
    )
  })

  it('only ever touches the signed-in account', async () => {
    const { app, session } = buildApp()
    session.userId = 'user-2'

    await request(app).delete('/account/passkey/cred-1')

    expect(user.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: 'user-2' })
  })

  it('decodes a credential id that was escaped for the url', async () => {
    const { app } = buildApp()

    await request(app).delete('/account/passkey/a%2Fb%2Bc')

    expect(user.findOneAndUpdate.mock.calls[0][1].$pull.credentials.credentialID).toBe('a/b+c')
  })

  it('reports a failed write', async () => {
    findOneAndUpdateRejects(new Error('store unreachable'))
    const { app } = buildApp()

    const res = await request(app).delete('/account/passkey/cred-1')

    expect(res.status).toBe(500)
  })
})
