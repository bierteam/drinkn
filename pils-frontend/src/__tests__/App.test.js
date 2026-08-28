import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../App.vue'
import { store } from '../store.js'

const del = vi.hoisted(() => vi.fn())

vi.mock('../services/Api', () => ({
  default: () => ({ delete: del })
}))

const mountApp = () => {
  const push = vi.fn()
  const wrapper = mount(App, {
    global: {
      mocks: { $router: { push } },
      stubs: {
        'router-link': { template: '<a><slot /></a>', props: ['to'] },
        'router-view': true
      }
    }
  })
  return { wrapper, push }
}

beforeEach(() => {
  del.mockReset()
  store.logout()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('navigation', () => {
  it('hides the menu from anonymous visitors', () => {
    const { wrapper } = mountApp()
    expect(wrapper.find('#navbar').exists()).toBe(false)
  })

  it('shows the menu once signed in', async () => {
    store.setAuthenticated('user-1')
    const { wrapper } = mountApp()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#navbar').exists()).toBe(true)
    expect(wrapper.text()).toContain('Discounts')
  })

  it('keeps the admin dropdown for admins only', async () => {
    store.setAuthenticated('user-1')
    const { wrapper } = mountApp()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Map store names')

    store.setAdmin()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Map store names')
  })
})

describe('Logout', () => {
  it('tells the server, clears the session and returns to login', async () => {
    del.mockResolvedValue({ status: 200 })
    store.setAuthenticated('user-1')
    const { wrapper, push } = mountApp()

    wrapper.vm.Logout()
    await flushPromises()

    expect(del).toHaveBeenCalledWith('/api/v1/users/logout')
    expect(store.isAuthenticated).toBe(false)
    expect(push).toHaveBeenCalledWith('/login')
  })

  it('still clears the session when the request fails', async () => {
    // a dead session is exactly when logout is most likely to error, so the
    // client must not stay stuck in a signed-in state
    del.mockRejectedValue(new Error('Network Error'))
    store.setAuthenticated('user-1')
    const { wrapper, push } = mountApp()

    wrapper.vm.Logout()
    await flushPromises()

    expect(store.isAuthenticated).toBe(false)
    expect(push).toHaveBeenCalledWith('/login')
  })
})
