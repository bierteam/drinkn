import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import User from '../User.vue'

const get = vi.hoisted(() => vi.fn())
const post = vi.hoisted(() => vi.fn())
const del = vi.hoisted(() => vi.fn())
const pwnedResult = vi.hoisted(() => ({ value: false }))

vi.mock('../../services/Api', () => ({
  default: () => ({ get, post, delete: del })
}))

vi.mock('../../services/pwned', () => ({
  default: async () => pwnedResult.value
}))

const mountUser = async () => {
  const push = vi.fn()
  const wrapper = mount(User, {
    global: {
      mocks: {
        $route: { params: { id: 'user-2' } },
        $router: { push }
      },
      stubs: { 'router-link': { template: '<a><slot /></a>', props: ['to'] } }
    }
  })
  await flushPromises()
  return { wrapper, push }
}

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  del.mockReset()
  pwnedResult.value = false
  get.mockResolvedValue({ status: 200, data: { username: 'nino', admin: false } })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchUser', () => {
  it('loads the user named in the route', async () => {
    const { wrapper } = await mountUser()

    expect(get).toHaveBeenCalledWith('/api/v1/users/user-2', {})
    expect(wrapper.vm.user).toEqual({ username: 'nino', admin: false })
    expect(wrapper.vm.newUser.admin).toBe(false)
  })

  it('surfaces a load failure', async () => {
    get.mockRejectedValue({ response: { data: 'Not found' } })
    const { wrapper } = await mountUser()

    expect(wrapper.vm.state.error).toBe('Not found')
  })
})

describe('updateUser', () => {
  it('posts the edited user and confirms', async () => {
    post.mockResolvedValue({ data: { username: 'nino', admin: true } })
    const { wrapper } = await mountUser()
    wrapper.vm.newUser = { admin: true }

    await wrapper.vm.updateUser()

    expect(post).toHaveBeenCalledWith('/api/v1/users/user-2', { user: { admin: true } })
    expect(wrapper.vm.state.saved).toBe(true)
    expect(wrapper.vm.state.saving).toBe(false)
    expect(wrapper.vm.state.error).toBe(false)
  })

  it('resets the draft to the saved admin flag', async () => {
    post.mockResolvedValue({ data: { username: 'nino', admin: true } })
    const { wrapper } = await mountUser()
    wrapper.vm.newUser = { admin: true, password: 'temporary' }

    await wrapper.vm.updateUser()

    expect(wrapper.vm.newUser).toEqual({ admin: true })
  })

  it('stops the spinner and reports a failed save', async () => {
    post.mockRejectedValue({ response: { data: 'Conflict' } })
    const { wrapper } = await mountUser()

    await wrapper.vm.updateUser()

    expect(wrapper.vm.state.error).toBe('Conflict')
    expect(wrapper.vm.state.saving).toBe(false)
  })
})

describe('deleteUser', () => {
  it('returns to the user list once deleted', async () => {
    del.mockResolvedValue({ status: 200 })
    const { wrapper, push } = await mountUser()

    await wrapper.vm.deleteUser()

    expect(del).toHaveBeenCalledWith('/api/v1/users/user-2')
    expect(push).toHaveBeenCalledWith('/users')
  })

  it('stays put and reports when deletion fails', async () => {
    del.mockRejectedValue(new Error('Boom'))
    const { wrapper, push } = await mountUser()

    await wrapper.vm.deleteUser()

    expect(push).not.toHaveBeenCalled()
    expect(wrapper.vm.state.error).toBe('Boom')
  })
})

describe('helpers', () => {
  it('blocks saving a breached password', async () => {
    pwnedResult.value = true
    const { wrapper } = await mountUser()

    await wrapper.vm.checkPwned('hunter2')

    expect(wrapper.vm.state.isPwned).toBe(true)
    expect(wrapper.vm.shouldDisableButton).toBe(true)
  })

  it('toggles the delete confirmation', async () => {
    const { wrapper } = await mountUser()

    wrapper.vm.toggleDeleteMsg()
    expect(wrapper.vm.state.deleteMsg).toBe(true)
    wrapper.vm.toggleDeleteMsg()
    expect(wrapper.vm.state.deleteMsg).toBe(false)
  })

  it('clears a shown error', async () => {
    get.mockRejectedValue({ response: { data: 'Not found' } })
    const { wrapper } = await mountUser()

    wrapper.vm.clearError()

    expect(wrapper.vm.state.error).toBe('')
  })
})

describe('passkeys', () => {
  const withKeys = credentials => ({ status: 200, data: { username: 'nino', admin: false, credentials } })

  it('lists what the user has registered', async () => {
    get.mockResolvedValue(withKeys([
      { credentialID: 'cred-1', name: 'Phone', createdAt: '2026-08-01T00:00:00.000Z' }
    ]))
    const { wrapper } = await mountUser()

    expect(wrapper.vm.passkeys).toHaveLength(1)
    expect(wrapper.text()).toContain('Phone')
  })

  it('copes with a user who has none', async () => {
    const { wrapper } = await mountUser()

    expect(wrapper.vm.passkeys).toEqual([])
    expect(wrapper.text()).toContain('This user has no passkeys.')
  })

  it('revokes against the user in the route, not the signed-in admin', async () => {
    const { wrapper } = await mountUser()

    del.mockResolvedValue(withKeys([]))
    await wrapper.vm.removePasskey('cred-1')

    expect(del).toHaveBeenCalledWith('/api/v1/users/user-2/passkey/cred-1')
    expect(wrapper.vm.passkeys).toEqual([])
  })

  it('escapes a credential id on its way into the url', async () => {
    const { wrapper } = await mountUser()

    del.mockResolvedValue(withKeys([]))
    await wrapper.vm.removePasskey('a/b+c')

    expect(del).toHaveBeenCalledWith('/api/v1/users/user-2/passkey/a%2Fb%2Bc')
  })

  it('surfaces a failed revocation', async () => {
    const { wrapper } = await mountUser()

    del.mockRejectedValue({ response: { data: 'Not found' } })
    await wrapper.vm.removePasskey('cred-1')

    expect(wrapper.vm.state.error).toBe('Not found')
  })

  it('offers no way to add one, since that needs the account holder', async () => {
    const { wrapper } = await mountUser()

    expect(wrapper.text()).not.toContain('Add passkey')
    expect(wrapper.text()).toContain('added by the account holder')
  })
})
