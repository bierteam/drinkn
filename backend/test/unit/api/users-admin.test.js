jest.mock('../../../models/user', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn()
}))
jest.mock('../../../services/passkey', () => ({}))
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/isAdmin', () => (req, res, next) => next())

const request = require('supertest')
const user = require('../../../models/user')
const writeLog = require('../../../services/writeLog')
const users = require('../../../api/v1/users')
const { buildApp: build, selected, selectedRejecting } = require('../helpers')

const buildApp = () => build('/users', users, { userId: 'admin-1', username: 'oscar', admin: true })

const findOneResolves = value => user.findOne.mockReturnValue(selected(value))
const updateResolves = value => user.findOneAndUpdate.mockReturnValue(selected(value))
const updateRejects = error => user.findOneAndUpdate.mockReturnValue(selectedRejecting(error))

beforeEach(() => {
  user.findOne.mockReset()
  user.findOneAndUpdate.mockReset()
  writeLog.mockReset()
  findOneResolves({ username: 'nino', admin: false, credentials: [] })
  updateResolves({ username: 'nino', admin: false, credentials: [] })
})

describe('GET /users/:_id', () => {
  it('includes the credential id, so a passkey can be revoked by it', async () => {
    const select = jest.fn().mockReturnValue({ exec: () => Promise.resolve({}) })
    user.findOne.mockReturnValue({ select })
    const { app } = buildApp()

    await request(app).get('/users/user-2')

    expect(select).toHaveBeenCalledWith(expect.stringContaining('credentials.credentialID'))
  })

  it('never selects the public key', async () => {
    const select = jest.fn().mockReturnValue({ exec: () => Promise.resolve({}) })
    user.findOne.mockReturnValue({ select })
    const { app } = buildApp()

    await request(app).get('/users/user-2')

    expect(select.mock.calls[0][0]).not.toContain('publicKey')
  })
})

describe('POST /users/:_id', () => {
  it('returns the passkeys too, so the list survives a save', async () => {
    const select = jest.fn().mockReturnValue({ exec: () => Promise.resolve({}) })
    user.findOneAndUpdate.mockReturnValue({ select })
    const { app } = buildApp()

    await request(app).post('/users/user-2').send({ user: { username: 'nino-renamed' } })

    expect(select).toHaveBeenCalledWith(expect.stringContaining('credentials.credentialID'))
  })
})

describe('DELETE /users/:_id/passkey/:credentialID', () => {
  it('pulls the credential from the named user', async () => {
    updateResolves({ username: 'nino', credentials: [] })
    const { app } = buildApp()

    const res = await request(app).delete('/users/user-2/passkey/cred-1')

    expect(res.status).toBe(200)
    expect(res.body.credentials).toEqual([])
    expect(user.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user-2' },
      { $pull: { credentials: { credentialID: 'cred-1' } } },
      { new: true }
    )
  })

  it('acts on the user in the path, not the admin in the session', async () => {
    const { app } = buildApp()

    await request(app).delete('/users/user-2/passkey/cred-1')

    expect(user.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: 'user-2' })
  })

  it('decodes a credential id that was escaped for the url', async () => {
    const { app } = buildApp()

    await request(app).delete('/users/user-2/passkey/a%2Fb%2Bc')

    expect(user.findOneAndUpdate.mock.calls[0][1].$pull.credentials.credentialID).toBe('a/b+c')
  })

  it('records the revocation as a warning', async () => {
    const { app } = buildApp()

    await request(app).delete('/users/user-2/passkey/cred-1')

    const warning = writeLog.mock.calls.find(c => c[1] === 'Warning')
    expect(warning[0]).toContain('user-2')
  })

  it('reports an unknown user rather than pretending to succeed', async () => {
    updateResolves(null)
    const { app } = buildApp()

    const res = await request(app).delete('/users/nobody/passkey/cred-1')

    expect(res.status).toBe(404)
  })

  it('reports a failed write', async () => {
    updateRejects(new Error('store unreachable'))
    const { app } = buildApp()

    const res = await request(app).delete('/users/user-2/passkey/cred-1')

    expect(res.status).toBe(500)
  })

  it('does not collide with deleting the user itself', async () => {
    // pins that the passkey route wins for the longer path
    user.deleteOne.mockResolvedValue({})
    const { app } = buildApp()

    await request(app).delete('/users/user-2/passkey/cred-1')

    expect(user.deleteOne).not.toHaveBeenCalled()
  })
})
