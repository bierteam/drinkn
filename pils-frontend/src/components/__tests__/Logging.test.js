import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Logging from '../Logging.vue'

const get = vi.hoisted(() => vi.fn())
const del = vi.hoisted(() => vi.fn())

vi.mock('../../services/Api', () => ({
  default: () => ({ get, delete: del })
}))

const logs = [
  { date: '2026-08-01', message: 'imported', context: 'Import', type: 'Info', ip: '1.1.1.1' },
  { date: '2026-08-02', message: 'login failed', context: 'Auth', type: 'Error', ip: '2.2.2.2' },
  { date: '2026-08-03', message: 'imported again', context: 'Import', type: 'Info', ip: '1.1.1.1' }
]

const mountLogging = async (query = {}) => {
  const replace = vi.fn()
  const wrapper = mount(Logging, {
    global: { mocks: { $route: { query }, $router: { replace } } }
  })
  await flushPromises()
  return { wrapper, replace }
}

beforeEach(() => {
  get.mockReset()
  del.mockReset()
  get.mockResolvedValue({ data: logs })
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

  it('collects the distinct contexts and types', async () => {
    const { wrapper } = await mountLogging()

    expect(wrapper.vm.contexts).toEqual(['Import', 'Auth'])
    expect(wrapper.vm.types).toEqual(['Info', 'Error'])
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
})

describe('query string handling', () => {
  it('keeps the defaults when the URL has no query', async () => {
    const { wrapper } = await mountLogging()

    // same bug as Discounts had: reading a missing key gave undefined
    expect(wrapper.vm.search).toBe('')
    expect(wrapper.vm.context).toBe('')
    expect(wrapper.vm.type).toBe('')
  })

  it('adopts the filters named in the URL', async () => {
    const { wrapper } = await mountLogging({ context: 'Import', type: 'Info' })

    expect(wrapper.vm.context).toBe('Import')
    expect(wrapper.vm.type).toBe('Info')
    expect(wrapper.vm.processed).toHaveLength(2)
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
})
