import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Discounts from '../Discounts.vue'

// a stand-in for the API: two online beers and one alcohol-free, offline one
const beers = () => ([
  { id: 'a', brand: 'Alfa', store: 'AH', volume: '500ml', uri: 'https://ah.nl/a', alcoholPercentage: 500, liter: 5, pricing: { oldPrice: 200, newPrice: 100, literPrice: 200 } },
  { id: 'b', brand: 'Brand', store: 'Jumbo', volume: '330ml', uri: 'https://jumbo.nl/b', alcoholPercentage: 500, liter: 3, pricing: { oldPrice: 300, newPrice: 150, literPrice: 500 } },
  { id: 'c', brand: 'Clausthaler', store: 'AH', volume: '500ml', uri: null, alcoholPercentage: 0, liter: 5, pricing: { oldPrice: 400, newPrice: 200, literPrice: 400 } }
])

const store = new Map()
let readFails = false

vi.mock('../../services/db', () => ({
  getCachedData: async key => {
    if (readFails) throw new Error('IndexedDB unavailable')
    return store.get(key)
  },
  setCachedData: async (key, value) => { store.set(key, value) }
}))

vi.mock('../../services/Api', () => ({
  default: () => ({ get: async () => ({ data: beers() }) })
}))

const mountWith = async (query = {}) => {
  const wrapper = mount(Discounts, {
    global: {
      mocks: {
        $route: { query },
        $router: { replace: vi.fn(), push: vi.fn() }
      }
    }
  })
  await vi.waitFor(() => expect(wrapper.vm.discounts.length).toBe(3))
  return wrapper
}

beforeEach(() => {
  store.clear()
  readFails = false
})

describe('helpers', () => {
  const { average, formatPrice } = Discounts.methods

  it('averages without a seeded zero dragging the result down', () => {
    // three values; a seeded [0] would divide by four and give 2
    expect(average([1, 2, 3])).toBe(2)
    expect(average([2, 4])).toBe(3)
  })

  it('returns 0 rather than NaN for an empty array', () => {
    expect(average([])).toBe(0)
  })

  it('formats numeric strings, not just numbers', () => {
    // discount.discount arrives as a toFixed() string and used to render raw
    expect(formatPrice('1.00')).toBe(formatPrice(1))
    expect(formatPrice(1)).toMatch(/1,00/)
  })

  it('passes through values that are not numbers at all', () => {
    expect(formatPrice(undefined)).toBe(undefined)
    expect(formatPrice('n/a')).toBe('n/a')
  })
})

describe('query string handling', () => {
  it('keeps the data() defaults when the URL has no query', async () => {
    const wrapper = await mountWith({})
    // reading a missing key gave undefined, which silently switched the
    // alcohol-free filter on while the 0.0 button rendered as off
    expect(wrapper.vm.zero).toBe(true)
    expect(wrapper.vm.online).toBe(false)
    expect(wrapper.vm.search).toBe('')
  })

  it('coerces query strings into booleans', async () => {
    const wrapper = await mountWith({ zero: 'false', online: 'true', store: 'AH' })
    expect(wrapper.vm.zero).toBe(false)
    expect(wrapper.vm.online).toBe(true)
    expect(wrapper.vm.store).toBe('AH')
  })

  it('shows alcohol-free beers by default and hides them when zero is off', async () => {
    const on = await mountWith({})
    expect(on.vm.processed).toHaveLength(3)

    const off = await mountWith({ zero: 'false' })
    expect(off.vm.processed.map(beer => beer.brand)).not.toContain('Clausthaler')
  })

  it('round-trips a non-default filter through the URL', async () => {
    const wrapper = await mountWith({})
    wrapper.vm.zero = false
    await wrapper.vm.$nextTick()
    // only the non-default state is worth encoding, and mounted() must be
    // able to read back whatever filterQuery writes
    expect(wrapper.vm.filterQuery).toEqual({ zero: 'false' })

    const reloaded = await mountWith(wrapper.vm.filterQuery)
    expect(reloaded.vm.zero).toBe(false)
  })

  it('keeps the URL clean while every filter is at its default', async () => {
    const wrapper = await mountWith({})
    expect(wrapper.vm.filterQuery).toEqual({})
  })

  it('does not navigate on every render', async () => {
    const wrapper = await mountWith({})
    const replace = wrapper.vm.$router.replace
    replace.mockClear()
    // a re-render used to fire router.replace via the updated() hook
    await wrapper.vm.$nextTick()
    expect(replace).not.toHaveBeenCalled()
  })
})

describe('caching', () => {
  it('does not accumulate totals across repeat visits', async () => {
    const first = await mountWith({})
    const counter = first.vm.onlineCounter
    const averageLength = first.vm.literAverage.length
    expect(counter).toBe(2)

    // second visit restores from cache before fetching again
    const second = await mountWith({})
    expect(second.vm.onlineCounter).toBe(counter)
    expect(second.vm.literAverage).toHaveLength(averageLength)

    const third = await mountWith({})
    expect(third.vm.onlineCounter).toBe(counter)
    expect(third.vm.literAverage).toHaveLength(averageLength)
  })

  it('still fetches when the cache cannot be read', async () => {
    readFails = true
    const wrapper = await mountWith({})
    expect(wrapper.vm.discounts).toHaveLength(3)
    expect(wrapper.vm.onlineCounter).toBe(2)
  })

  it('takes the liter price from the API rather than recomputing it', async () => {
    const wrapper = await mountWith({})
    const alfa = wrapper.vm.discounts.find(beer => beer.id === 'a')
    expect(alfa.literPrice).toBe(200)
  })
})
