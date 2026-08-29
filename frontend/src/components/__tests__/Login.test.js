import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Login from '../Login.vue'
import { store } from '../../store.js'

const post = vi.hoisted(() => vi.fn())
const startAuthentication = vi.hoisted(() => vi.fn())
const supported = vi.hoisted(() => ({ value: true }))

vi.mock('../../services/Api', () => ({
  default: () => ({ post })
}))

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication,
  browserSupportsWebAuthn: () => supported.value
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
  startAuthentication.mockReset()
  supported.value = true
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
      remember: true
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

describe('Passkey', () => {
  const optionsThenLogin = (data = { _id: 'user-1' }) => {
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    startAuthentication.mockResolvedValue({ id: 'cred-1' })
    post.mockResolvedValueOnce({ status: 200, data })
  }

  it('fetches options, signs the challenge and authenticates', async () => {
    optionsThenLogin()
    const { wrapper, push } = mountLogin()
    await wrapper.vm.Passkey()

    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/users/login/passkey/options', {})
    expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: { challenge: 'abc' } })
    expect(post).toHaveBeenNthCalledWith(2, '/api/v1/users/login/passkey', {
      response: { id: 'cred-1' },
      remember: true
    })
    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('user-1')
    expect(push).toHaveBeenCalledWith('/discounts')
  })

  it('needs no username or password', async () => {
    optionsThenLogin()
    const { wrapper } = mountLogin()
    // the password form is still disabled; the passkey path ignores it
    expect(wrapper.vm.isDisabled).toBe(true)

    await wrapper.vm.Passkey()

    expect(store.isAuthenticated).toBe(true)
  })

  it('marks admins as admin', async () => {
    optionsThenLogin({ _id: 'user-1', admin: true })
    const { wrapper } = mountLogin()
    await wrapper.vm.Passkey()

    expect(store.isAdmin).toBe(true)
  })

  it('honours the redirect the guard put in the query', async () => {
    optionsThenLogin()
    const { wrapper, push } = mountLogin({ redirect: '/users' })
    await wrapper.vm.Passkey()

    expect(push).toHaveBeenCalledWith('/users')
  })

  it('treats a dismissed browser prompt as a message, not an error', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const cancelled = new Error('The operation either timed out or was not allowed')
    cancelled.name = 'NotAllowedError'
    startAuthentication.mockRejectedValue(cancelled)
    const { wrapper, push } = mountLogin()
    await wrapper.vm.Passkey()

    expect(wrapper.vm.message).toBe('Passkey sign in was cancelled.')
    expect(wrapper.vm.error).toBe('')
    expect(push).not.toHaveBeenCalled()
  })

  it('surfaces a server refusal', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    startAuthentication.mockResolvedValue({ id: 'cred-1' })
    post.mockRejectedValueOnce({ response: { data: 'That passkey was not accepted' } })
    const { wrapper } = mountLogin()
    await wrapper.vm.Passkey()

    expect(wrapper.vm.error).toBe('That passkey was not accepted')
    expect(store.isAuthenticated).toBe(false)
  })

  it('clears the busy flag whichever way it ends', async () => {
    post.mockRejectedValueOnce({ response: { data: 'Server error' } })
    const { wrapper } = mountLogin()
    await wrapper.vm.Passkey()

    expect(wrapper.vm.passkeyBusy).toBe(false)
  })

  it('hides the button on a browser without webauthn', () => {
    supported.value = false
    const { wrapper } = mountLogin()

    expect(wrapper.find('button[type="button"]').exists()).toBe(false)
  })
})
