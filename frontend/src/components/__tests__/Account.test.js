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
const startRegistration = vi.hoisted(() => vi.fn())
const supported = vi.hoisted(() => ({ value: true }))

vi.mock('../../services/Api', () => ({
  default: () => ({ get, post, delete: del })
}))

vi.mock('@simplewebauthn/browser', () => ({
  startRegistration,
  browserSupportsWebAuthn: () => supported.value
}))

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
  startRegistration.mockReset()
  supported.value = true
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

  it('enables as soon as there is a change to submit', async () => {
    const wrapper = mountAccount()
    wrapper.vm.newUser.username = 'oscar-renamed'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isDisabled).toBe(false)
  })

  it('renders the Save button as enabled, not just the flag', async () => {
    const wrapper = mountAccount()
    wrapper.vm.newUser.username = 'oscar-renamed'
    await wrapper.vm.$nextTick()

    const save = wrapper.find('button[type="submit"]')
    expect(save.attributes('disabled')).toBe(undefined)
  })

  it('flags a pwned password and blocks submission', async () => {
    pwnedResult.value = true
    const wrapper = mountAccount()
    wrapper.vm.newUser.password = 'hunter2'
    await vi.waitFor(() => expect(wrapper.vm.state.isPwned).toBe(true))

    expect(wrapper.vm.isDisabled).toBe(true)
  })

  it('blocks submission while the verification does not match', async () => {
    const wrapper = mountAccount()
    wrapper.vm.newUser.password = 'a-good-one'
    wrapper.vm.verifyPassword = 'mistyped'
    await vi.waitFor(() => expect(wrapper.vm.state.notEqual).toBe(true))

    expect(wrapper.vm.isDisabled).toBe(true)
  })

  it('clears the mismatch once the verification catches up', async () => {
    const wrapper = mountAccount()
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

describe('Passkeys', () => {
  const account = credentials => ({ status: 200, data: { username: 'oscar', credentials } })

  it('lists the registered passkeys', async () => {
    get.mockResolvedValue(account([{ credentialID: 'cred-1', name: 'Laptop', createdAt: '2026-08-01T00:00:00.000Z' }]))
    const wrapper = mountAccount()
    await flushPromises()

    expect(wrapper.vm.passkeys).toHaveLength(1)
    expect(wrapper.text()).toContain('Laptop')
  })

  it('copes with an account that has none', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    expect(wrapper.vm.passkeys).toEqual([])
    expect(wrapper.text()).toContain('No passkeys yet.')
  })

  it('fetches options, enrols the key and keeps the returned list', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    startRegistration.mockResolvedValue({ id: 'cred-1' })
    post.mockResolvedValueOnce(account([{ credentialID: 'cred-1', name: 'Laptop' }]))

    wrapper.vm.passkeyName = 'Laptop'
    await wrapper.vm.AddPasskey()

    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/account/passkey/options', {})
    expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: { challenge: 'abc' } })
    expect(post).toHaveBeenNthCalledWith(2, '/api/v1/account/passkey', {
      response: { id: 'cred-1' },
      name: 'Laptop'
    })
    expect(wrapper.vm.passkeys).toHaveLength(1)
    expect(wrapper.vm.passkeyName).toBe('')
  })

  it('names an unnamed key rather than sending nothing', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    startRegistration.mockResolvedValue({ id: 'cred-1' })
    post.mockResolvedValueOnce(account([]))
    await wrapper.vm.AddPasskey()

    expect(post).toHaveBeenLastCalledWith('/api/v1/account/passkey', expect.objectContaining({ name: 'Passkey' }))
  })

  it('treats a dismissed browser prompt as a message, not an error', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const cancelled = new Error('cancelled')
    cancelled.name = 'NotAllowedError'
    startRegistration.mockRejectedValue(cancelled)
    await wrapper.vm.AddPasskey()

    expect(wrapper.vm.message).toBe('Passkey setup was cancelled.')
    expect(wrapper.vm.error).toBe('')
  })

  it('says nothing when a password manager hands the ceremony over', async () => {
    // Bitwarden aborts its own overlay for "use hardware key"; that is not a
    // cancellation and should not be reported as one
    const wrapper = mountAccount()
    await flushPromises()

    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const handoff = new Error('aborted')
    handoff.name = 'AbortError'
    startRegistration.mockRejectedValue(handoff)
    await wrapper.vm.AddPasskey()

    expect(wrapper.vm.message).toBe('')
    expect(wrapper.vm.error).toBe('')
    expect(wrapper.vm.state.passkeyBusy).toBe(false)
  })

  it('explains a key that is already enrolled', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const duplicate = new Error('already registered')
    duplicate.name = 'InvalidStateError'
    startRegistration.mockRejectedValue(duplicate)
    await wrapper.vm.AddPasskey()

    expect(wrapper.vm.error).toBe('That passkey is already registered on this account.')
  })

  it('clears the busy flag whichever way it ends', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    post.mockRejectedValueOnce({ response: { data: 'Server error' } })
    await wrapper.vm.AddPasskey()

    expect(wrapper.vm.state.passkeyBusy).toBe(false)
  })

  it('removes a passkey and keeps the returned list', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    del.mockResolvedValue(account([]))
    wrapper.vm.RemovePasskey('cred-1')
    await flushPromises()

    expect(del).toHaveBeenCalledWith('/api/v1/account/passkey/cred-1')
    expect(wrapper.vm.passkeys).toEqual([])
  })

  it('escapes a credential id on its way into the url', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    del.mockResolvedValue(account([]))
    wrapper.vm.RemovePasskey('a/b+c')
    await flushPromises()

    expect(del).toHaveBeenCalledWith('/api/v1/account/passkey/a%2Fb%2Bc')
  })

  it('surfaces a failed removal', async () => {
    const wrapper = mountAccount()
    await flushPromises()

    del.mockRejectedValue({ response: { data: 'Not found' } })
    wrapper.vm.RemovePasskey('cred-1')
    await flushPromises()

    expect(wrapper.vm.error).toBe('Not found')
  })

  it('warns instead of offering the button when webauthn is missing', async () => {
    supported.value = false
    const wrapper = mountAccount()
    await flushPromises()

    expect(wrapper.text()).toContain('This browser does not support passkeys.')
    expect(wrapper.find('#account-passkey-name').exists()).toBe(false)
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
