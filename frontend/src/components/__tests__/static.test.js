import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Home from '../Home.vue'
import NotFound from '../NotFound.vue'
import Import from '../Import.vue'

const post = vi.hoisted(() => vi.fn())

vi.mock('../../services/Api', () => ({
  default: () => ({ post })
}))

const stubs = { 'router-link': { template: '<a><slot /></a>', props: ['to'] } }

beforeEach(() => {
  post.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Home', () => {
  it('renders', () => {
    const wrapper = mount(Home, { global: { stubs } })
    expect(wrapper.html()).toBeTruthy()
  })
})

describe('NotFound', () => {
  it('renders', () => {
    const wrapper = mount(NotFound, { global: { stubs } })
    expect(wrapper.html()).toBeTruthy()
  })
})

describe('Import', () => {
  it('records the response on a successful import', async () => {
    post.mockResolvedValue({ status: 200, data: 'Imported 42 beers' })
    const wrapper = mount(Import, { global: { stubs } })

    wrapper.vm.Import()
    await flushPromises()

    expect(post).toHaveBeenCalledWith('/api/v1/import', {})
    expect(wrapper.vm.status.data).toBe('Imported 42 beers')
    expect(wrapper.text()).toContain('Imported 42 beers')
  })

  it('collects errors for display', async () => {
    const failure = new Error('Boom')
    post.mockRejectedValue(failure)
    const wrapper = mount(Import, { global: { stubs } })

    wrapper.vm.Import()
    await flushPromises()

    expect(wrapper.vm.errors).toEqual([failure])
    expect(wrapper.vm.status).toBe(null)
  })
})
