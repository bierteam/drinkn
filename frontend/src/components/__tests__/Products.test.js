import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Products from '../Products.vue'

// every amount is cents. 'Plain' is at its normal shelf price -- the case the
// old beer schema could not represent at all. 'NoVolume' is sold as "2 stuks",
// where AH publishes no volume and so no litre price exists.
const items = () => ([
  { _id: 'a', brand: 'Alfa', title: 'Alfa Edel Pils', store: 'Jumbo', volume: '6 x 0,3 l', uri: 'https://jumbo.nl/a', isDiscounted: true, price: { current: 749, base: 999, literPrice: 416 }, discount: { endsAt: '2026-09-05T00:00:00.000Z' } },
  { _id: 'b', brand: 'Brand', title: 'Brand Pilsener', store: 'Albert Heijn', volume: '0,5 l', uri: null, isDiscounted: false, price: { current: 169, base: null, literPrice: 338 }, discount: {} },
  { _id: 'c', brand: 'Cheap', title: 'Cheap 2-pack', store: 'Albert Heijn', volume: '2 stuks', uri: null, isDiscounted: false, price: { current: 1498, base: null, literPrice: null }, discount: {} }
])

const calls = []
let failNext = false
let emptyNext = false
vi.mock('../../services/Api', () => ({
  default: () => ({
    get: async (url, config) => {
      calls.push({ url, params: config?.params })
      if (url.endsWith('/facets')) return { data: { stores: ['Albert Heijn', 'Jumbo'], total: 900, discounted: 300 } }
      if (failNext) throw new Error('offline')
      if (emptyNext) return { data: { items: [], total: 0, totalPages: 0, page: 0 } }
      return { data: { items: items(), total: 3, totalPages: 2, page: 0 } }
    }
  })
}))

const mountProducts = async () => {
  const wrapper = mount(Products)
  await vi.waitFor(() => expect(wrapper.vm.products).toHaveLength(3))
  await wrapper.vm.$nextTick()
  return wrapper
}

beforeEach(() => {
  calls.length = 0
  failNext = false
  emptyNext = false
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Products', () => {
  it('shows undiscounted products alongside offers', async () => {
    const wrapper = await mountProducts()
    const text = wrapper.text()
    // the whole point: a beer at its normal price is a row here
    expect(text).toContain('Brand Pilsener')
    expect(text).toContain('Alfa Edel Pils')
  })

  it('renders every amount from cents', async () => {
    const wrapper = await mountProducts()
    expect(wrapper.text()).toContain('7,49')
    expect(wrapper.text()).toContain('4,16')
  })

  it('shows a dash rather than zero where no litre price exists', async () => {
    const wrapper = await mountProducts()
    const row = wrapper.findAll('tbody tr')[2]
    expect(row.text()).toContain('—')
  })

  it('marks only the discounted row as an offer', async () => {
    const wrapper = await mountProducts()
    const tags = wrapper.findAll('.tag')
    expect(tags).toHaveLength(1)
    expect(tags[0].text()).toContain('25%')
  })

  it('asks the server to filter rather than filtering in the browser', async () => {
    const wrapper = await mountProducts()
    calls.length = 0

    wrapper.vm.store = 'Jumbo'
    await vi.waitFor(() => expect(calls.some(c => c.params?.store === 'Jumbo')).toBe(true))
  })

  it('returns to the first page when a filter changes', async () => {
    const wrapper = await mountProducts()
    wrapper.vm.page = 3

    wrapper.vm.onlyDiscounted = true
    await vi.waitFor(() => expect(wrapper.vm.page).toBe(0))
  })

  it('pages through results on the server', async () => {
    const wrapper = await mountProducts()
    window.scrollTo = vi.fn()
    calls.length = 0

    wrapper.vm.turnTo(1)
    await vi.waitFor(() => expect(calls.some(c => c.params?.page === 1)).toBe(true))
  })

  it('debounces typing instead of a request per keystroke', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const wrapper = mount(Products)
    await vi.waitFor(() => expect(wrapper.vm.products).toHaveLength(3))
    calls.length = 0

    wrapper.vm.search = 'her'
    await wrapper.vm.$nextTick()
    wrapper.vm.search = 'hert'
    await wrapper.vm.$nextTick()
    expect(calls.filter(c => c.params?.search)).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(400)
    expect(calls.filter(c => c.params?.search === 'hert')).toHaveLength(1)
  })

  it('asks the server to re-sort when the direction flips', async () => {
    const wrapper = await mountProducts()
    calls.length = 0

    wrapper.vm.dir = 'desc'
    await vi.waitFor(() => expect(calls.some(c => c.params?.dir === 'desc')).toBe(true))
  })

  it('says so when the products cannot be loaded', async () => {
    failNext = true
    const wrapper = mount(Products)

    await vi.waitFor(() => expect(wrapper.vm.error).toBeTruthy())
    await wrapper.vm.$nextTick()
    // an empty table would read as "no beers exist" rather than "we could not ask"
    expect(wrapper.text()).toContain('Could not load products')
    expect(wrapper.find('tbody').exists()).toBe(false)
  })

  it('distinguishes no matches from a failure', async () => {
    emptyNext = true
    const wrapper = mount(Products)

    await vi.waitFor(() => expect(wrapper.vm.loading).toBe(false))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No products match')
  })

  it('shows the offer end date where there is one', async () => {
    const wrapper = await mountProducts()
    expect(wrapper.vm.validUntil(items()[0])).toBeTruthy()
    expect(wrapper.vm.validUntil(items()[1])).toBeNull()
  })
})
