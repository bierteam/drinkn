jest.mock('../../../models/user', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn()
}))
jest.mock('../../../services/passkey', () => ({
  registrationOptions: jest.fn(),
  verifyRegistration: jest.fn()
}))
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/isAuthenticated', () => (req, res, next) => next())

const request = require('supertest')
const user = require('../../../models/user')
const account = require('../../../api/v1/account')
const { buildApp: build, selected } = require('../helpers')

const buildApp = () => build('/account', account, { userId: 'user-1', username: 'oscar' })

const updateResolves = value => user.findOneAndUpdate.mockReturnValue(selected(value))

const findOneResolves = value => user.findOne.mockReturnValue(selected(value))

const parametersOf = () => user.findOneAndUpdate.mock.calls[0][1].$set

beforeEach(() => {
  user.findOne.mockReset()
  user.findOneAndUpdate.mockReset()
  user.deleteOne.mockReset().mockResolvedValue({})
  updateResolves({ username: 'oscar' })
  findOneResolves({ username: 'oscar', credentials: [] })
})

describe('GET /account', () => {
  it('returns the signed-in account', async () => {
    const { app } = buildApp()

    const res = await request(app).get('/account')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ username: 'oscar', credentials: [] })
    expect(user.findOne).toHaveBeenCalledWith({ _id: 'user-1' })
  })

  it('reads whoever the session names, not a value from the request', async () => {
    const { app, session } = buildApp()
    session.userId = 'user-2'

    await request(app).get('/account')

    expect(user.findOne).toHaveBeenCalledWith({ _id: 'user-2' })
  })

  it('reports a failed read', async () => {
    user.findOne.mockReturnValue({
      select: () => ({ exec: () => Promise.reject(new Error('store unreachable')) })
    })
    const { app } = buildApp()

    const res = await request(app).get('/account')

    expect(res.status).toBe(500)
  })
})

describe('DELETE /account/delete', () => {
  it('deletes the account and clears the cookie', async () => {
    const { app } = buildApp()

    const res = await request(app).delete('/account/delete')

    expect(res.status).toBe(200)
    expect(user.deleteOne).toHaveBeenCalledWith({ _id: 'user-1' })
    expect(res.headers['set-cookie'].join(';')).toContain('connect.sid=')
  })

  it('only ever deletes the signed-in account', async () => {
    const { app, session } = buildApp()
    session.userId = 'user-2'

    await request(app).delete('/account/delete')

    expect(user.deleteOne).toHaveBeenCalledWith({ _id: 'user-2' })
  })

  it('reports a failed delete', async () => {
    user.deleteOne.mockRejectedValue(new Error('store unreachable'))
    const { app } = buildApp()

    const res = await request(app).delete('/account/delete')

    expect(res.status).toBe(500)
  })
})

describe('POST /account', () => {
  it('changes the username without asking for a password first', async () => {
    // the old-password field never actually verified anything, so it is gone;
    // the session is what authorises this
    const { app } = buildApp()

    const res = await request(app).post('/account').send({ user: { username: 'oscar-renamed' } })

    expect(res.status).toBe(200)
    expect(parametersOf().username).toBe('oscar-renamed')
  })

  it('changes the password without asking for the old one', async () => {
    const { app } = buildApp()

    const res = await request(app).post('/account').send({ user: { password: 'a-new-secret' } })

    expect(res.status).toBe(200)
    expect(parametersOf().password).toBe('a-new-secret')
  })

  it('stamps who made the change', async () => {
    const { app } = buildApp()
    await request(app).post('/account').send({ user: { username: 'oscar-renamed' } })

    expect(parametersOf().editedBy).toEqual({ _id: 'user-1', username: 'oscar' })
  })

  it('refuses an update that changes nothing', async () => {
    const { app } = buildApp()

    const res = await request(app).post('/account').send({ user: {} })

    expect(res.status).toBe(400)
    // an empty body used to be stopped by the missing old password; without a
    // guard it would write nothing but editedBy
    expect(user.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('ignores an old password if a caller still sends one', async () => {
    const { app } = buildApp()

    const res = await request(app).post('/account').send({
      user: { username: 'oscar-renamed', oldPassword: 'whatever' }
    })

    expect(res.status).toBe(200)
    expect(parametersOf().oldPassword).toBe(undefined)
  })

  it('reports a failed write', async () => {
    user.findOneAndUpdate.mockReturnValue({
      select: () => ({ exec: () => Promise.reject(new Error('store unreachable')) })
    })
    const { app } = buildApp()

    const res = await request(app).post('/account').send({ user: { username: 'oscar-renamed' } })

    expect(res.status).toBe(500)
  })
})
