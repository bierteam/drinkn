jest.mock('axios')
jest.mock('../../../services/writeLog', () => jest.fn())

// the module caches its token for the life of the process, so each test gets a
// fresh copy of it -- and a fresh axios mock with it, since resetModules hands
// out a new one
const load = get => {
  jest.resetModules()
  const axios = require('axios')
  axios.post = jest.fn().mockResolvedValue({ data: { access_token: 'tok' } })
  axios.get = get
  const ah = require('../../../sources/ah')
  return { ah, axios }
}

const page = (products, totalPages = 1) => ({ data: { products, page: { totalPages } } })
const item = id => ({ webshopId: id, title: `Beer ${id}`, brand: 'B', salesUnitSize: '0,5 l', priceBeforeBonus: 1.5 })

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick'] })
})

afterEach(() => {
  jest.useRealTimers()
})

// the adapter sleeps between requests to stay polite; drive the timers so the
// test does not actually wait
const runFetch = async ah => {
  const promise = ah.fetch()
  await jest.runAllTimersAsync()
  return promise
}

describe('ah.fetch', () => {
  it('sends the application header the API actually requires', async () => {
    const { ah, axios } = load(jest.fn().mockResolvedValue(page([item(1)])))

    await runFetch(ah)

    // `Application` (without the X-) returns a 500 reading
    // "Can not find application: 'null'", which looks like an outage
    const [, config] = axios.get.mock.calls[0]
    expect(config.headers['X-Application']).toBe('AHWEBSHOP')
    expect(config.headers.Authorization).toBe('Bearer tok')
  })

  it('authenticates once and reuses the token', async () => {
    const { ah, axios } = load(jest.fn().mockResolvedValue(page([item(1)])))

    await runFetch(ah)

    // the anonymous token is valid for a week, so re-authenticating per
    // category is pointless noise against their auth service
    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('walks every beer taxonomy node', async () => {
    const { ah, axios } = load(jest.fn().mockResolvedValue(page([])))

    await runFetch(ah)

    const requested = axios.get.mock.calls.map(([, config]) => config.params.taxonomyId)
    expect(requested).toEqual(ah.TAXONOMY.map(t => t.id))
  })

  it('follows pagination within a node', async () => {
    const { ah } = load(jest.fn()
      .mockResolvedValueOnce(page([item(1)], 2))
      .mockResolvedValueOnce(page([item(2)], 2))
      .mockResolvedValue(page([], 0)))

    const result = await runFetch(ah)

    expect(result.map(p => p.webshopId)).toEqual([1, 2])
  })

  it('does not return the same product twice across nodes', async () => {
    // a beer legitimately sits in more than one taxonomy node, and duplicates
    // would stop the unique {source, sourceId} index from building at all
    const { ah } = load(jest.fn().mockResolvedValue(page([item(1)])))

    const result = await runFetch(ah)

    expect(result).toHaveLength(1)
  })
})

describe('ah.enabled', () => {
  it('is on unless it is explicitly switched off', () => {
    const { ah } = load(jest.fn())
    delete process.env.SOURCE_AH
    expect(ah.enabled()).toBe(true)
    process.env.SOURCE_AH = 'false'
    expect(ah.enabled()).toBe(false)
    delete process.env.SOURCE_AH
  })
})
