/* global describe, it, expect, jest, beforeEach, afterEach */
jest.mock('../../../models/beer', () => ({ find: jest.fn() }))

// discount.js reads process.env.PR at module load to decide its query, so each
// test re-requires it under the env it wants. resetModules hands out a fresh
// copy of the mocked model too, so the model is taken from the same load.
const load = (env = {}) => {
  const original = process.env.PR
  jest.resetModules()
  if (env.PR) process.env.PR = env.PR
  else delete process.env.PR

  const beer = require('../../../models/beer')
  const discount = require('../../../services/discount')

  if (original === undefined) delete process.env.PR
  else process.env.PR = original

  return { discount, beer }
}

// exec is passed in as a mock so rejections are created when called rather
// than when the query is built, which would surface as an unhandled rejection
const stubQuery = (beer, exec) => {
  const query = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    exec
  }
  beer.find.mockReturnValue(query)
  return query
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('discount', () => {
  it('returns what the query resolves to', async () => {
    const { discount, beer } = load()
    stubQuery(beer, jest.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }]))

    await expect(discount()).resolves.toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('filters to currently valid discounts by default', async () => {
    const { discount, beer } = load()
    stubQuery(beer, jest.fn().mockResolvedValue([]))

    await discount()

    const [filter] = beer.find.mock.calls[0]
    // only offers that have not expired
    expect(filter).toHaveProperty('validity.$gte')
  })

  it('recomputes the validity cutoff on every call', async () => {
    const { discount, beer } = load()
    stubQuery(beer, jest.fn().mockResolvedValue([]))

    await discount()
    const first = beer.find.mock.calls[0][0].validity.$gte
    await new Promise(resolve => setTimeout(resolve, 5))
    await discount()
    const second = beer.find.mock.calls[1][0].validity.$gte

    // the cutoff used to be assigned at module load, so it stayed pinned to
    // process start and let expired offers through
    expect(second.getTime()).toBeGreaterThan(first.getTime())
  })

  it('does not cap the result set by default', async () => {
    const { discount, beer } = load()
    const query = stubQuery(beer, jest.fn().mockResolvedValue([]))

    await discount()

    expect(query.limit).toHaveBeenCalledWith(0)
  })

  it('serves unfiltered sample data on preview builds', async () => {
    const { discount, beer } = load({ PR: '1' })
    const query = stubQuery(beer, jest.fn().mockResolvedValue([]))

    await discount()

    // preview environments have no live import, so they show the most recent
    // records regardless of validity
    expect(beer.find).toHaveBeenCalledWith({})
    expect(query.sort).toHaveBeenCalledWith({ validity: -1 })
    expect(query.limit).toHaveBeenCalledWith(100)
  })

  it('returns an empty list rather than throwing when the query fails', async () => {
    const { discount, beer } = load()
    stubQuery(beer, jest.fn().mockRejectedValue(new Error('mongo down')))

    await expect(discount()).resolves.toEqual([])
    expect(console.error).toHaveBeenCalled()
  })
})
