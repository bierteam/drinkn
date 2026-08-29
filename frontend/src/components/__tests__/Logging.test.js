import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Logging from '../Logging.vue'

const get = vi.hoisted(() => vi.fn())
const del = vi.hoisted(() => vi.fn())

vi.mock('../../services/Api', () => ({
  default: () => ({ get, delete: del })
}))

const logs = [
  { _id: '1', date: '2026-08-01T09:15:00.000Z', message: 'imported 42 beers', context: 'Import', type: 'Info', ip: '1.1.1.1' },
  { _id: '2', date: '2026-08-03T22:40:00.000Z', message: 'login failed', context: 'Auth', type: 'Error', ip: '2.2.2.2' },
  { _id: '3', date: '2026-08-02T12:00:00.000Z', message: 'imported again', context: 'Import', type: 'Warning', ip: '1.1.1.1' }
]

const mountLogging = async (query = {}) => {
  const replace = vi.fn()
  const wrapper = mount(Logging, {
    global: { mocks: { $route: { query }, $router: { replace } } }
  })
  await flushPromises()
  return { wrapper, replace }
}

const ids = wrapper => wrapper.vm.processed.map(log => log._id)

beforeEach(() => {
  get.mockReset()
  del.mockReset()
  get.mockResolvedValue({ data: logs })
  window.innerWidth = 375
  vi.useRealTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLogs', () => {
  it('loads the logs on mount', async () => {
    const { wrapper } = await mountLogging()

    expect(get).toHaveBeenCalledWith('/api/v1/logging')
    expect(wrapper.vm.logs).toHaveLength(3)
  })

  it('derives the distinct contexts and types', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.contexts).toEqual(['Auth', 'Import'])
    expect(wrapper.vm.types).toEqual(['Error', 'Info', 'Warning'])
  })

  it('does not list a context twice after a reload', async () => {
    // these were arrays that only ever got pushed into, never cleared
    const { wrapper } = await mountLogging()
    await wrapper.vm.getLogs()

    expect(wrapper.vm.contexts).toEqual(['Auth', 'Import'])
  })

  it('keeps going when the fetch fails', async () => {
    get.mockRejectedValue(new Error('Boom'))
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.logs).toEqual([])
  })
})

describe('deleteLogs', () => {
  it('empties the table and shows the server message', async () => {
    del.mockResolvedValue({ data: 'Deleted 3 logs' })
    const { wrapper } = await mountLogging()

    await wrapper.vm.deleteLogs()

    expect(del).toHaveBeenCalledWith('/api/v1/logging')
    expect(wrapper.vm.message).toBe('Deleted 3 logs')
    expect(wrapper.vm.logs).toEqual([])
  })

  it('leaves the logs alone when the delete fails', async () => {
    del.mockRejectedValue(new Error('Boom'))
    const { wrapper } = await mountLogging()

    await wrapper.vm.deleteLogs()

    expect(wrapper.vm.logs).toHaveLength(3)
  })

  it('keeps the confirmation out of the table, where it was invalid markup', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.state.deleteMsg = true
    await wrapper.vm.$nextTick()

    const confirm = wrapper.find('.notification.is-light')
    expect(confirm.exists()).toBe(true)
    expect(confirm.element.closest('table')).toBe(null)
  })
})

describe('mobile layout', () => {
  it('renders a card per entry, not only a table', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.findAll('.log-card')).toHaveLength(3)
  })

  it('keeps the cards and the table on opposite breakpoints', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.find('.cards').classes()).toContain('is-hidden-desktop')
    expect(wrapper.find('.table-container').classes()).toContain('is-hidden-touch')
  })

  it('shows the whole message on a card rather than a fixed 50 characters', async () => {
    const { wrapper } = await mountLogging()
    const card = wrapper.findAll('.log-card').find(c => c.text().includes('imported 42 beers'))

    expect(card.find('.log-message').text()).toBe('imported 42 beers')
  })

  it('colours the entry by its type', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.typeClass({ type: 'Error' })).toBe('is-danger')
    expect(wrapper.vm.typeClass({ type: 'Warning' })).toBe('is-warning')
    expect(wrapper.vm.typeClass({ type: 'Info' })).toBe('is-info')
    expect(wrapper.vm.typeClass({})).toBe('')
  })

  it('gives every row a key of its own', async () => {
    // rows were keyed on log.id, which the api does not send, so every key
    // was undefined
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.logs.every(log => log._id)).toBe(true)
  })
})

describe('formatting', () => {
  it('renders a readable timestamp', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.formatDate('2026-08-01T09:15:00.000Z')).toMatch(/2026/)
  })

  it('passes an unparseable date through untouched', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.formatDate('whenever')).toBe('whenever')
    expect(wrapper.vm.formatDate(undefined)).toBe('')
  })

  it('only appends an ellipsis to a message that was actually cut', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.truncate('short')).toBe('short')
    expect(wrapper.vm.truncate('x'.repeat(100))).toBe('x'.repeat(80) + '…')
  })

  it('survives a message that is missing', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.truncate(undefined)).toBe('')
  })
})

describe('sorting', () => {
  it('puts the newest entry first', async () => {
    const { wrapper } = await mountLogging()

    expect(ids(wrapper)).toEqual(['2', '3', '1'])
  })

  it('reverses on the direction toggle', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.sortDir = 1
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['1', '3', '2'])
  })

  it('sorts by a column header, which used to call a method that did not exist', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.sortBy('context')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.sort).toBe('context')
    expect(ids(wrapper)).toEqual(['2', '1', '3'])
  })

  it('flips the direction when the same column is picked again', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.sortBy('date')

    expect(wrapper.vm.sortDir).toBe(1)
  })

  it('starts a date column newest first and any other ascending', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.sortBy('type')
    expect(wrapper.vm.sortDir).toBe(1)

    wrapper.vm.sortBy('date')
    expect(wrapper.vm.sortDir).toBe(-1)
  })
})

describe('filtering', () => {
  it('matches a context exactly instead of searching every field', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.context = 'Auth'
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['2'])
  })

  it('filters by type', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.type = 'Info'
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['1'])
  })

  it('searches the message and the ip', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.search = '2.2.2.2'
    await wrapper.vm.$nextTick()
    expect(ids(wrapper)).toEqual(['2'])

    wrapper.vm.search = '42 beers'
    await wrapper.vm.$nextTick()
    expect(ids(wrapper)).toEqual(['1'])
  })

  it('reports an empty result rather than an empty page', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.search = 'nothing matches this'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Nothing matches those filters')
  })

  it('says nothing about filters before the logs have loaded', async () => {
    get.mockResolvedValue({ data: [] })
    const { wrapper } = await mountLogging()

    expect(wrapper.text()).not.toContain('Nothing matches those filters')
  })

  it('clears everything back to the defaults', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.search = 'login'
    wrapper.vm.context = 'Auth'
    wrapper.vm.type = 'Error'
    wrapper.vm.reset()
    await wrapper.vm.$nextTick()

    expect(ids(wrapper)).toEqual(['2', '3', '1'])
  })

  it('filters by context when a card tag is tapped', async () => {
    const { wrapper } = await mountLogging()
    await wrapper.findAll('.log-card button.tag')[0].trigger('click')

    expect(wrapper.vm.context).toBe('Auth')
  })
})

describe('the filter panel', () => {
  it('starts folded away on a phone', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.showFilters).toBe(false)
    expect(wrapper.find('#logging-filter-panel').isVisible()).toBe(false)
  })

  it('starts open where there is room for it', async () => {
    window.innerWidth = 1280
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.showFilters).toBe(true)
  })

  it('opens itself when a filter arrives from the URL', async () => {
    const { wrapper } = await mountLogging({ type: 'Error' })

    expect(wrapper.vm.showFilters).toBe(true)
  })

  it('opens and closes on the toggle', async () => {
    const { wrapper } = await mountLogging()
    await wrapper.find('#logging-filter-toggle').trigger('click')

    expect(wrapper.find('#logging-filter-panel').isVisible()).toBe(true)
  })

  it('counts only the filters the toggle is hiding', async () => {
    const { wrapper } = await mountLogging()
    wrapper.vm.search = 'login'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.hiddenFilterCount).toBe(0)

    wrapper.vm.context = 'Auth'
    wrapper.vm.type = 'Error'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#logging-filter-toggle').text()).toContain('(2)')
  })
})

describe('query string handling', () => {
  it('keeps the defaults when the URL has no query', async () => {
    const { wrapper } = await mountLogging()

    // same bug as Discounts had: reading a missing key gave undefined
    expect(wrapper.vm.search).toBe('')
    expect(wrapper.vm.context).toBe('')
    expect(wrapper.vm.type).toBe('')
    expect(wrapper.vm.sort).toBe('date')
    expect(wrapper.vm.sortDir).toBe(-1)
  })

  it('adopts the filters named in the URL', async () => {
    const { wrapper } = await mountLogging({ context: 'Import', type: 'Info' })

    expect(wrapper.vm.context).toBe('Import')
    expect(wrapper.vm.type).toBe('Info')
    expect(ids(wrapper)).toEqual(['1'])
  })

  it('restores the sort key and direction', async () => {
    const { wrapper } = await mountLogging({ sort: 'context', dir: 'asc' })

    expect(wrapper.vm.sort).toBe('context')
    expect(wrapper.vm.sortDir).toBe(1)
  })

  it('ignores a sort key that is not on offer', async () => {
    const { wrapper } = await mountLogging({ sort: 'somethingElse' })

    expect(wrapper.vm.sort).toBe('date')
  })

  it('does not navigate on every render', async () => {
    const { wrapper, replace } = await mountLogging()
    replace.mockClear()

    await wrapper.vm.$nextTick()

    // this used to fire from updated(), once per render
    expect(replace).not.toHaveBeenCalled()
  })

  it('encodes only the filters that are set', async () => {
    const { wrapper } = await mountLogging()
    expect(wrapper.vm.filterQuery).toEqual({})

    wrapper.vm.context = 'Auth'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filterQuery).toEqual({ context: 'Auth' })
  })

  it('writes the active filters back to the URL once, after a pause', async () => {
    vi.useFakeTimers()
    const { wrapper, replace } = await mountLogging()

    wrapper.vm.search = 'lo'
    await wrapper.vm.$nextTick()
    wrapper.vm.search = 'log'
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(300)

    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({ query: { search: 'log' } })
  })

  it('leaves a pending navigation behind on unmount', async () => {
    vi.useFakeTimers()
    const { wrapper, replace } = await mountLogging()

    wrapper.vm.search = 'login'
    await wrapper.vm.$nextTick()
    wrapper.unmount()
    vi.advanceTimersByTime(300)

    expect(replace).not.toHaveBeenCalled()
  })
})
