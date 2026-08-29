import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Discounts from '../Discounts.vue'

// prices are cents, literPrice is euros per litre, alcoholPercentage is
// multiplied by a hundred. 'Cheap' is the alcohol free one and has no uri.
const beers = () => ([
  { id: 'a', brand: 'Alfa', store: 'Jumbo', volume: '500ml', uri: 'https://jumbo.nl/a', alcoholPercentage: 500, pricing: { oldPrice: 200, newPrice: 100, literPrice: 2 } },
  { id: 'b', brand: 'Brand', store: 'AH', volume: '330ml', uri: 'https://ah.nl/b', alcoholPercentage: 500, pricing: { oldPrice: 1000, newPrice: 100, literPrice: 3.03 } },
  { id: 'c', brand: 'Cheap', store: 'AH', volume: '500ml', uri: null, alcoholPercentage: 0, pricing: { oldPrice: 110, newPrice: 100, literPrice: 1 } }
])

const cache = new Map()

vi.mock('../../services/db', () => ({
  getCachedData: async key => cache.get(key),
  setCachedData: async (key, value) => { cache.set(key, value) }
}))

vi.mock('../../services/Api', () => ({
  default: () => ({ get: async () => ({ data: beers() }) })
}))

const mountWith = async (query = {}) => {
  const replace = vi.fn()
  const wrapper = mount(Discounts, {
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      mocks: {
        $route: { query },
        $router: { replace, push: vi.fn() }
      }
    }
  })
  await vi.waitFor(() => expect(wrapper.vm.discounts).toHaveLength(3))
  return { wrapper, replace }
}

const ids = wrapper => wrapper.vm.processed.map(item => item.id)

beforeEach(() => {
  cache.clear()
  vi.useRealTimers()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('mobile layout', () => {
  it('renders a card per discount, not only a table', async () => {
    const { wrapper } = await mountWith()

    expect(wrapper.findAll('.discount-card')).toHaveLength(3)
  })

  it('puts the new and the old price on every card', async () => {
    // both prices were off screen at 375px, which is the whole point of the page
    const { wrapper } = await mountWith()
    const cards = wrapper.findAll('.discount-card')

    expect(cards).toHaveLength(3)
    for (const card of cards) {
      expect(card.find('.has-text-success').text()).toMatch(/^€/)
      expect(card.find('s').text()).toMatch(/^€/)
    }
  })

  it('shows the struck through old price beside the new one', async () => {
    const { wrapper } = await mountWith()
    // 'Alfa' is 1,00 down from 2,00
    const alfa = wrapper.findAll('.discount-card').find(card => card.text().includes('Alfa'))

    expect(alfa.find('.has-text-success').text()).toContain('1,00')
    expect(alfa.find('s').text()).toContain('2,00')
  })

  it('gives every online discount a buy button inside its card', async () => {
    const { wrapper } = await mountWith()
    const links = wrapper.findAll('.discount-card a[href]')

    expect(links).toHaveLength(2)
    expect(links[0].attributes('rel')).toBe('noopener noreferrer')
  })

  it('shows the liter price, which is what the list sorts by', async () => {
    const { wrapper } = await mountWith()

    expect(wrapper.findAll('.discount-card')[0].text()).toContain('/ liter')
  })

  it('keeps the cards and the table on opposite breakpoints', async () => {
    const { wrapper } = await mountWith()

    expect(wrapper.find('.cards').classes()).toContain('is-hidden-desktop')
    expect(wrapper.find('.table-container').classes()).toContain('is-hidden-touch')
  })

  it('confines the horizontal scroll to the table', async () => {
    // the old markup was class='table container', which let the whole page
    // scroll sideways instead of just the table
    const { wrapper } = await mountWith()

    expect(wrapper.find('.table-container').exists()).toBe(true)
  })
})

describe('sorting', () => {
  it('sorts by liter price ascending by default', async () => {
    const { wrapper } = await mountWith()

    expect(ids(wrapper)).toEqual(['c', 'a', 'b'])
  })

  it('reverses on the direction toggle', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.sortDir = -1
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['b', 'a', 'c'])
  })

  it('compares the percentage as a number, not as a string', async () => {
    // discountPercentage is a toPrecision() string, so '9.1' used to sort
    // above '90' and the biggest discounts ended up in the middle
    const { wrapper } = await mountWith()
    wrapper.vm.sort = 'discountPercentage'
    wrapper.vm.sortDir = -1
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['b', 'a', 'c'])
  })

  it('offers a sort control, because there are no headers to click on a phone', async () => {
    const { wrapper } = await mountWith()
    const options = wrapper.findAll('#discounts-sort option').map(option => option.attributes('value'))

    expect(options).toContain('literPrice')
    expect(options).toContain('discountPercentage')
  })

  it('starts a newly picked column ascending', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.sortDir = -1
    wrapper.vm.sortBy('brand')

    expect(wrapper.vm.sort).toBe('brand')
    expect(wrapper.vm.sortDir).toBe(1)
  })

  it('flips the direction when the same column is picked again', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.sortBy('literPrice')

    expect(wrapper.vm.sortDir).toBe(-1)
  })
})

describe('filtering', () => {
  it('matches a store exactly instead of searching every field', async () => {
    // a substring search over the whole record also matched uris such as ah.nl
    const { wrapper } = await mountWith()
    wrapper.vm.store = 'AH'
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['c', 'b'])
  })

  it('searches the fields a visitor can see', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.search = 'alfa'
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['a'])
  })

  it('does not match on a uri', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.search = 'jumbo.nl'
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual([])
  })

  it('filters by volume', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.volume = '330ml'
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['b'])
  })

  it('hides the alcohol free entries when 0.0 is switched off', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.zero = false
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['a', 'b'])
  })

  it('hides an entry whose alcohol percentage is unknown when 0.0 is switched off', async () => {
    // the import only sets the field when biernet lists one, and a missing
    // strength is no promise that there is alcohol in the bottle
    const { wrapper } = await mountWith()
    wrapper.vm.discounts.push({
      id: 'd', brand: 'Dunno', store: 'AH', volume: '500ml', uri: null, literPrice: 2, pricing: { oldPrice: 200, newPrice: 100, literPrice: 2 }
    })
    wrapper.vm.zero = false
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['a', 'b'])
  })

  it('keeps only the buyable ones for the online filter', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.online = true
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['a', 'b'])
  })

  it('reports an empty result rather than an empty page', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.search = 'nothing matches this'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Nothing matches those filters')
  })

  it('clears everything back to the defaults', async () => {
    const { wrapper } = await mountWith()
    wrapper.vm.search = 'alfa'
    wrapper.vm.store = 'AH'
    wrapper.vm.online = true
    wrapper.vm.zero = false
    wrapper.vm.reset()
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['c', 'a', 'b'])
  })

  it('does not mutate the loaded list while sorting', async () => {
    const { wrapper } = await mountWith()
    const before = wrapper.vm.discounts.map(item => item.id)
    wrapper.vm.sortDir = -1
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.discounts.map(item => item.id)).toEqual(before)
  })
})

describe('the filter panel', () => {
  it('starts folded away on a phone, so the list is not pushed off screen', async () => {
    window.innerWidth = 375
    const { wrapper } = await mountWith()

    expect(wrapper.vm.showFilters).toBe(false)
    expect(wrapper.find('#discounts-filter-panel').isVisible()).toBe(false)
  })

  it('starts open where there is room for it', async () => {
    window.innerWidth = 1280
    const { wrapper } = await mountWith()

    expect(wrapper.vm.showFilters).toBe(true)
  })

  it('opens itself when a filter arrives from the URL', async () => {
    // an invisible filter behind a shut panel looks like missing data
    window.innerWidth = 375
    const { wrapper } = await mountWith({ store: 'AH' })

    expect(wrapper.vm.showFilters).toBe(true)
  })

  it('opens and closes on the toggle', async () => {
    window.innerWidth = 375
    const { wrapper } = await mountWith()
    await wrapper.find('#discounts-filter-toggle').trigger('click')

    expect(wrapper.find('#discounts-filter-panel').isVisible()).toBe(true)
  })

  it('counts only the filters the toggle is hiding', async () => {
    window.innerWidth = 375
    const { wrapper } = await mountWith()
    wrapper.vm.search = 'alfa'
    await wrapper.vm.$nextTick()
    // the search box is on screen, so it does not belong in the badge
    expect(wrapper.vm.hiddenFilterCount).toBe(0)

    wrapper.vm.store = 'AH'
    wrapper.vm.zero = false
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.hiddenFilterCount).toBe(2)
    expect(wrapper.find('#discounts-filter-toggle').text()).toContain('(2)')
  })
})

describe('query string handling', () => {
  it('keeps the defaults when the URL has no query', async () => {
    const { wrapper } = await mountWith({})

    expect(wrapper.vm.zero).toBe(true)
    expect(wrapper.vm.online).toBe(false)
    expect(wrapper.vm.search).toBe('')
    expect(wrapper.vm.sort).toBe('literPrice')
  })

  it('restores filters, sort key and direction from the URL', async () => {
    const { wrapper } = await mountWith({ store: 'AH', zero: 'false', sort: 'discount', dir: 'desc' })

    expect(wrapper.vm.store).toBe('AH')
    expect(wrapper.vm.zero).toBe(false)
    expect(wrapper.vm.sort).toBe('discount')
    expect(wrapper.vm.sortDir).toBe(-1)
  })

  it('ignores a sort key that is not on offer', async () => {
    const { wrapper } = await mountWith({ sort: 'somethingElse' })

    expect(wrapper.vm.sort).toBe('literPrice')
  })

  it('writes the active filters back to the URL once, after a pause', async () => {
    vi.useFakeTimers()
    const { wrapper, replace } = await mountWith()

    wrapper.vm.search = 'a'
    await wrapper.vm.$nextTick()
    wrapper.vm.search = 'al'
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(300)

    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({ query: { search: 'al' } })
  })

  it('leaves a pending navigation behind on unmount', async () => {
    vi.useFakeTimers()
    const { wrapper, replace } = await mountWith()

    wrapper.vm.search = 'alfa'
    await wrapper.vm.$nextTick()
    wrapper.unmount()
    vi.advanceTimersByTime(300)

    expect(replace).not.toHaveBeenCalled()
  })
})

describe('cards', () => {
  it('renders the alcohol percentage as a readable figure', async () => {
    const { wrapper } = await mountWith()

    expect(wrapper.vm.alcohol({ alcoholPercentage: 500 })).toBe('5%')
    expect(wrapper.vm.alcohol({})).toBe(null)
  })

  it('rounds the discount percentage for display', async () => {
    const { wrapper } = await mountWith()

    expect(wrapper.vm.percentage({ discountPercentage: '9.1' })).toBe(9)
  })

  it('only shows a validity date when there is a usable one', async () => {
    const { wrapper } = await mountWith()

    expect(wrapper.vm.validUntil({})).toBe(null)
    expect(wrapper.vm.validUntil({ validity: 'not a date' })).toBe(null)
    expect(wrapper.vm.validUntil({ validity: '2026-08-29T00:00:00.000Z' })).toContain('aug')
  })

  it('filters by store when a store tag is tapped', async () => {
    const { wrapper } = await mountWith()
    await wrapper.findAll('.discount-card button.tag')[0].trigger('click')

    expect(wrapper.vm.store).toBe('AH')
  })
})
