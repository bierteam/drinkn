jest.mock('../../../models/log', () => ({ find: jest.fn(), deleteMany: jest.fn() }))
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/isAdmin', () => (req, res, next) => next())

const request = require('supertest')
const logging = require('../../../models/log')
const writeLog = require('../../../services/writeLog')
const router = require('../../../api/v1/logging')
const { buildApp: build, query } = require('../helpers')

const buildApp = () => build('/logging', router, { userId: 'admin-1', username: 'oscar', admin: true })

const entry = { message: 'something happened', date: new Date(0).toISOString(), context: 'Server', type: 'Info' }

const findResolves = value => {
  const exec = () => Promise.resolve(value)
  logging.find.mockReturnValue({ select: () => ({ limit: () => ({ sort: () => ({ exec }) }) }) })
}
const findRejects = error => {
  const exec = () => Promise.reject(error)
  logging.find.mockReturnValue({ select: () => ({ limit: () => ({ sort: () => ({ exec }) }) }) })
}

beforeEach(() => {
  logging.find.mockReset()
  logging.deleteMany.mockReset()
  writeLog.mockReset()
  findResolves([entry])
  logging.deleteMany.mockReturnValue(query({ deletedCount: 3 }))
})

describe('the model backs the calls the routes make', () => {
  // Model.remove() was dropped in mongoose 7 and this route kept calling it,
  // so every delete 500'd. mocks alone would never notice — check the real one.
  it.each(['find', 'deleteMany'])('mongoose still exposes %s', name => {
    const log = jest.requireActual('../../../models/log')
    expect(typeof log[name]).toBe('function')
  })
})

describe('GET /logging', () => {
  it('returns the log entries', async () => {
    const { app } = buildApp()

    const res = await request(app).get('/logging')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([entry])
  })

  it('returns a 500 when the lookup fails', async () => {
    findRejects(new Error('mongo is down'))
    const { app } = buildApp()

    const res = await request(app).get('/logging')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Server error' })
  })
})

describe('DELETE /logging', () => {
  it('deletes every entry', async () => {
    const { app } = buildApp()

    const res = await request(app).delete('/logging')

    expect(res.status).toBe(200)
    expect(logging.deleteMany).toHaveBeenCalledWith({})
  })

  it('records who cleared the logs', async () => {
    const { app } = buildApp()

    await request(app).delete('/logging')

    expect(writeLog).toHaveBeenCalledWith(
      expect.stringContaining('deleted the logs'), 'Warning', 'Logging', '203.0.113.1'
    )
  })

  it('returns a 500 when the delete fails', async () => {
    const error = new Error('mongo is down')
    logging.deleteMany.mockReturnValue({ exec: () => Promise.reject(error) })
    const { app } = buildApp()

    const res = await request(app).delete('/logging')

    expect(res.status).toBe(500)
    expect(writeLog).toHaveBeenCalledWith(error, 'Error', 'Logging')
  })
})
