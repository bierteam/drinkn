/* global describe, it, expect, jest, beforeEach, afterEach */
jest.mock('../../../models/log', () => ({ create: jest.fn() }))

const logger = require('../../../models/log')
const writeLog = require('../../../services/writeLog')

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('writeLog', () => {
  it('persists the message with its context and ip', async () => {
    await writeLog('imported 42 beers', 'Info', 'Import', '1.1.1.1')

    expect(logger.create).toHaveBeenCalledWith(expect.objectContaining({
      message: 'imported 42 beers',
      type: 'Info',
      context: 'Import',
      ip: '1.1.1.1'
    }))
  })

  it('stamps every entry with a date', async () => {
    await writeLog('something', 'Info', 'Test', '1.1.1.1')

    const [entry] = logger.create.mock.calls[0]
    expect(entry.date).toBeInstanceOf(Date)
  })

  it('coerces non-string values rather than storing them raw', async () => {
    await writeLog(42, 'Info', 'Test', 1234)

    expect(logger.create).toHaveBeenCalledWith(expect.objectContaining({
      message: '42',
      ip: '1234'
    }))
  })

  it('leaves missing fields undefined instead of throwing', async () => {
    await expect(writeLog(undefined, undefined, undefined, undefined)).resolves.toBeUndefined()

    expect(logger.create).toHaveBeenCalledWith(expect.objectContaining({
      message: undefined,
      type: undefined
    }))
  })

  it('swallows a database failure so logging never breaks the request', async () => {
    logger.create.mockRejectedValueOnce(new Error('mongo down'))

    await expect(writeLog('anything', 'Info', 'Test', '1.1.1.1')).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })
})
