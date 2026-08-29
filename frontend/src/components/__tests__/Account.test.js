import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Account from '../Account.vue'
import { store } from '../../store.js'

const pwnedResult = vi.hoisted(() => ({ value: false }))

vi.mock('../../services/pwned', () => ({
  default: async () => pwnedResult.value
}))

const get = vi.hoisted(() => vi.fn())
const post = vi.hoisted(() => vi.fn())
const del = vi.hoisted(() => vi.fn())
const toDataURL = vi.hoisted(() => vi.fn())

vi.mock('../../services/Api', () => ({
  default: () => ({ get, post, delete: del })
}))

vi.mock('qrcode', () => ({ default: { toDataURL } }))

const mountAccount = () => mount(Account, {
  global: {
    mocks: {
      $route: { query: {} },
      $router: { push: vi.fn() }
    }
  }
})

beforeEach(() => {
  pwnedResult.value = false
  get.mockReset()
  post.mockReset()
  del.mockReset()
  toDataURL.mockReset()
  get.mockResolvedValue({ status: 200, data: { username: 'oscar', admin: false } })
  store.logout()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Account isDisabled', () => {
  it('is a plain boolean, not a promise', () => {
    const wrapper = mountAccount()
    // this used to be an async computed, so it returned a Promise. a Promise
    // is always truthy, which left :disabled="isDisabled" permanently on and
    // made the Save button impossible to click.
    expect(wrapper.vm.isDisabled).not.toBeInstanceOf(Promise)
    expect(typeof wrapper.vm.isDisabled).toBe('boolean')
  })

  it('stays disabled while there is nothing to submit', () => {
    const wrapper = mountAccount()
    expect(wrapper.vm.isDisabled).toBe(true)
  })

  it('enables once the old password and a change are supplied', async () => {
    const wrapper = mountAccount()
    wrapper.vm.newUser.oldPassword = 'current-secret'
    wrapper.vm.newUser.username = 'oscar-renamed'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isDisabled).toBe(false)
  })

  it('renders the Save button as enabled, not just the flag', async () => {
    const wrapper = mountAccount()
    wrapper.vm.newUser.oldPassword = 'current-secret'
    wrapper.vm.newUser.username = 'oscar-renamed'
    await wrapper.vm.$nextTick()

    const save = wrapper.find('button[type="submit"]')
    expect(save.attributes('disabled')).toBe(undefined)
  })

  it('flags a pwned password and blocks submission', async () => {
    pwnedResult.value = true
    const wrapper = mountAccount()
    wrapper.vm.newUser.oldPassword = 'current-secret'
    wrapper.vm.newUser.password = 'hunter2'
    await vi.waitFor(() => expect(wrapper.vm.state.isPwned).toBe(true))

    expect(wrapper.vm.isDisabled).toBe(true)
  })

  it('blocks submission while the verification does not match', async () => {
    const wrapper = mountAccount()
    wrapper.vm.newUser.oldPassword = 'current-secret'
    wrapper.vm.newUser.password = 'a-good-one'
    wrapper.vm.verifyPassword = 'mistyped'
    await vi.waitFor(() => expect(wrapper.vm.state.notEqual).toBe(true))

    expect(wrapper.vm.isDisabled).toBe(true)
  })

  it('clears the mismatch once the verification catches up', async () => {
    const wrapper = mountAccount()
    wrapper.vm.newUser.oldPassword = 'current-secret'
    wrapper.vm.newUser.password = 'a-good-one'
    wrapper.vm.verifyPassword = 'a-good-one'
    await vi.waitFor(() => expect(wrapper.vm.state.notEqual).toBe(false))

    expect(wrapper.vm.isDisabled).toBe(false)
  })
})

describe('Account', () => {
  it('loads the signed-in user on create', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    expect(get).toHaveBeenCalledWith('/api/v1/account', {})
    expect(wrapper.vm.user).toEqual({ username: 'oscar', admin: false })
  })

  it('surfaces a load failure', async () => {
    get.mockRejectedValue({ response: { data: 'Unauthorised' } })
    const wrapper = mountAccount()
    await flushPromises()

    expect(wrapper.vm.error).toBe('Unauthorised')
  })
})

describe('Otp', () => {
  it('renders a QR code for the returned secret', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    get.mockResolvedValue({ status: 200, data: { uri: 'otpauth://totp/pils' } })
    wrapper.vm.Otp()
    await flushPromises()

    expect(toDataURL).toHaveBeenCalledWith(
      'otpauth://totp/pils',
      { errorCorrectionLevel: 'H' },
      expect.any(Function)
    )
    expect(wrapper.vm.otp.uri).toBe('otpauth://totp/pils')
  })

  it('surfaces a failure to start 2FA setup', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    get.mockRejectedValue({ response: { data: 'Already enabled' } })
    wrapper.vm.Otp()
    await flushPromises()

    expect(wrapper.vm.error).toBe('Already enabled')
  })
})

describe('Update', () => {
  it('saves and clears the draft', async () => {
    const wrapper = mountAccount()
    await flushPromises()
    wrapper.vm.newUser = { username: 'oscar-renamed' }

    post.mockResolvedValue({ status: 200, data: { username: 'oscar-renamed' } })
    wrapper.vm.Update()
    await flushPromises()

    expect(post).toHaveBeenCalledWith('/api/v1/account', { user: { username: 'oscar-renamed' } })
    expect(wrapper.vm.user).toEqual({ username: 'oscar-renamed' })
    expect(wrapper.vm.newUser).toEqual({})
    expect(wrapper.vm.verifyPassword).toBe(undefined)
    expect(wrapper.vm.state.saved).toBe(true)
    expect(wrapper.vm.state.saving).toBe(false)
  })

  it('stops the spinner and flags an error on failure', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    post.mockRejectedValue({ response: { data: 'Wrong password' } })
    wrapper.vm.Update()
    await flushPromises()

    expect(wrapper.vm.error).toBe('Wrong password')
    expect(wrapper.vm.state.error).toBe(true)
    expect(wrapper.vm.state.saving).toBe(false)
  })
})

describe('Delete', () => {
  it('signs out and returns to login', async () => {
    store.setAuthenticated('user-1')
    const wrapper = mountAccount()
    await flushPromises()

    del.mockResolvedValue({ status: 200 })
    wrapper.vm.Delete()
    await flushPromises()

    expect(del).toHaveBeenCalledWith('/api/v1/account/delete')
    expect(store.isAuthenticated).toBe(false)
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/login')
  })

  it('keeps the session when deletion fails', async () => {
    store.setAuthenticated('user-1')
    const wrapper = mountAccount()
    await flushPromises()

    del.mockRejectedValue({ response: { data: 'Forbidden' } })
    wrapper.vm.Delete()
    await flushPromises()

    expect(wrapper.vm.error).toBe('Forbidden')
    expect(store.isAuthenticated).toBe(true)
  })
})
