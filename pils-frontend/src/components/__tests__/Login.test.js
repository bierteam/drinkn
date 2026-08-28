import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Login from '../Login.vue'
import { store } from '../../store.js'

const post = vi.hoisted(() => vi.fn())

vi.mock('../../services/Api', () => ({
  default: () => ({ post })
}))

const mountLogin = (query = {}) => {
  const push = vi.fn()
  const wrapper = mount(Login, {
    global: {
      mocks: {
        $route: { query },
        $router: { push }
      }
    }
  })
  return { wrapper, push }
}

const submit = async (wrapper, { username = 'oscar', password = 'secret' } = {}) => {
  wrapper.vm.username = username
  wrapper.vm.password = password
  wrapper.vm.Post()
  await flushPromises()
}

beforeEach(() => {
  post.mockReset()
  store.logout()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isDisabled', () => {
  it('blocks submission until both fields are filled', async () => {
    const { wrapper } = mountLogin()
    expect(wrapper.vm.isDisabled).toBe(true)

    wrapper.vm.username = 'oscar'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isDisabled).toBe(true)

    wrapper.vm.password = 'secret'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isDisabled).toBe(false)
  })
})

describe('Post', () => {
  it('sends the credentials and the remember flag', async () => {
    post.mockResolvedValue({ status: 200, data: { _id: 'user-1' } })
    const { wrapper } = mountLogin()
    await submit(wrapper)

    expect(post).toHaveBeenCalledWith('/api/v1/users/login', {
      username: 'oscar',
      password: 'secret',
      remember: true,
      token: undefined
    })
  })

  it('authenticates and lands on discounts', async () => {
    post.mockResolvedValue({ status: 200, data: { _id: 'user-1' } })
    const { wrapper, push } = mountLogin()
    await submit(wrapper)

    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('user-1')
    expect(store.isAdmin).toBe(false)
    expect(push).toHaveBeenCalledWith('/discounts')
  })

  it('marks admins as admin', async () => {
    post.mockResolvedValue({ status: 200, data: { _id: 'user-1', admin: true } })
    const { wrapper } = mountLogin()
    await submit(wrapper)

    expect(store.isAdmin).toBe(true)
  })

  it('honours the redirect the guard put in the query', async () => {
    post.mockResolvedValue({ status: 200, data: { _id: 'user-1' } })
    const { wrapper, push } = mountLogin({ redirect: '/users' })
    await submit(wrapper)

    expect(push).toHaveBeenCalledWith('/users')
  })

  it('asks for a second factor without authenticating', async () => {
    post.mockResolvedValue({ status: 200, data: { otp: true } })
    const { wrapper, push } = mountLogin()
    await submit(wrapper)

    expect(wrapper.vm.otpRequired).toBe(true)
    expect(wrapper.vm.message).toBe('Two factor authentication required.')
    expect(store.isAuthenticated).toBe(false)
    expect(push).not.toHaveBeenCalled()
  })

  it('sends the token once a second factor is required', async () => {
    post.mockResolvedValue({ status: 200, data: { otp: true } })
    const { wrapper } = mountLogin()
    await submit(wrapper)

    post.mockResolvedValue({ status: 200, data: { _id: 'user-1' } })
    wrapper.vm.token = '123456'
    wrapper.vm.Post()
    await flushPromises()

    expect(post).toHaveBeenLastCalledWith('/api/v1/users/login', expect.objectContaining({
      token: '123456'
    }))
    expect(store.isAuthenticated).toBe(true)
  })

  it('focuses the 2FA field once, not on every keystroke', async () => {
    const focus = vi.spyOn(window.HTMLInputElement.prototype, 'focus')
    post.mockResolvedValue({ status: 200, data: { otp: true } })
    const { wrapper } = mountLogin()
    focus.mockClear()

    await submit(wrapper)
    await wrapper.vm.$nextTick()
    expect(focus).toHaveBeenCalledTimes(1)

    // typing re-renders; the old updated() hook re-focused on every one
    const field = wrapper.find('input[name="token"]')
    await field.setValue('123')
    await field.setValue('123456')

    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('surfaces the server message on a rejected login', async () => {
    post.mockRejectedValue({ response: { data: 'Invalid credentials' } })
    const { wrapper } = mountLogin()
    await submit(wrapper)

    expect(wrapper.vm.error).toBe('Invalid credentials')
    expect(store.isAuthenticated).toBe(false)
  })

  it('falls back to the raw error when there is no response body', async () => {
    const failure = new Error('Network Error')
    post.mockRejectedValue(failure)
    const { wrapper } = mountLogin()
    await submit(wrapper)

    expect(wrapper.vm.error).toBe(failure)
  })
})
