import { describe, it, expect, vi, beforeEach } from 'vitest'
import { average, decorate, formatPrice, useDiscounts } from '../useDiscounts.js'

const beers = () => ([
  { id: 'a', brand: 'Alfa', store: 'Jumbo', volume: '500ml', uri: 'https://jumbo.nl/a', alcoholPercentage: 500, liter: 500, pricing: { oldPrice: 200, newPrice: 100, literPrice: 2 } },
  { id: 'b', brand: 'Brand', store: 'AH', volume: '330ml', uri: null, alcoholPercentage: 500, liter: 330, pricing: { oldPrice: 300, newPrice: 150, literPrice: 4.55 } }
])

const cache = new Map()
let readFails = false
let writeFails = false
let getFails = false

vi.mock('../../services/db', () => ({
  getCachedData: async key => {
    if (readFails) throw new Error('IndexedDB unavailable')
    return cache.get(key)
  },
  setCachedData: async (key, value) => {
    if (writeFails) throw new Error('quota exceeded')
    cache.set(key, value)
  }
}))

vi.mock('../../services/Api', () => ({
  default: () => ({
    get: async () => {
      if (getFails) throw new Error('offline')
      return { data: beers() }
    }
  })
}))

beforeEach(() => {
  cache.clear()
  readFails = false
  writeFails = false
  getFails = false
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('decorate', () => {
  it('lifts the nested prices onto the record', () => {
    const item = decorate(beers()[0])

    expect(item.newPrice).toBe(100)
    expect(item.oldPrice).toBe(200)
    expect(item.literPrice).toBe(2)
  })

  it('derives the saving and the percentage', () => {
    const item = decorate(beers()[0])

    expect(item.discount).toBe('1.00')
    expect(Number(item.discountPercentage)).toBe(50)
  })

  it('leaves the source record alone', () => {
    const source = beers()[0]
    decorate(source)

    expect(source.newPrice).toBe(undefined)
  })
})

describe('average', () => {
  it('averages numeric strings as numbers', () => {
    expect(average(['1.00', '2.00', '3.00'])).toBe(2)
  })

  it('returns 0 rather than NaN for an empty list', () => {
    expect(average([])).toBe(0)
  })
})

describe('formatPrice', () => {
  it('formats numbers and numeric strings the same way', () => {
    expect(formatPrice('1.00')).toBe(formatPrice(1))
    expect(formatPrice(1)).toMatch(/1,00/)
  })

  it('passes through what is not a number', () => {
    expect(formatPrice(undefined)).toBe(undefined)
    expect(formatPrice('n/a')).toBe('n/a')
  })
})

describe('useDiscounts', () => {
  it('loads, decorates and caches', async () => {
    const { discounts, loading, load } = useDiscounts()
    expect(loading.value).toBe(true)

    await load()

    expect(discounts.value).toHaveLength(2)
    expect(discounts.value[0].newPrice).toBe(100)
    expect(loading.value).toBe(false)
    expect(cache.get('discounts')).toHaveLength(2)
  })

  it('paints from the cache before the request lands', async () => {
    cache.set('discounts', [{ id: 'cached', brand: 'Cached' }])
    const { discounts, load } = useDiscounts()

    const pending = load()
    await Promise.resolve()
    expect(discounts.value[0].brand).toBe('Cached')

    await pending
    expect(discounts.value).toHaveLength(2)
  })

  it('keeps the cached list when the request fails', async () => {
    cache.set('discounts', [{ id: 'cached', brand: 'Cached' }])
    getFails = true
    const { discounts, loading, load } = useDiscounts()

    await load()

    expect(discounts.value[0].brand).toBe('Cached')
    expect(loading.value).toBe(false)
  })

  it('still fetches when the cache cannot be read', async () => {
    readFails = true
    const { discounts, load } = useDiscounts()

    await load()

    expect(discounts.value).toHaveLength(2)
  })

  it('still shows data when the cache cannot be written', async () => {
    writeFails = true
    const { discounts, loading, load } = useDiscounts()

    await load()

    expect(discounts.value).toHaveLength(2)
    expect(loading.value).toBe(false)
  })

  it('derives the filter options and the summary figures', async () => {
    const view = useDiscounts()
    await view.load()

    expect(view.stores.value).toEqual(['AH', 'Jumbo'])
    expect(view.volumes.value).toEqual(['330ml', '500ml'])
    expect(view.onlineCount.value).toBe(1)
    expect(view.averageDiscount.value).toBe(1.25)
    expect(view.averagePercentage.value).toBe(50)
  })

  it('replaces the totals on a reload instead of adding to them', async () => {
    const view = useDiscounts()
    await view.load()
    await view.load()

    // the accumulating version of this double counted anything already on screen
    expect(view.discounts.value).toHaveLength(2)
    expect(view.onlineCount.value).toBe(1)
  })
})
