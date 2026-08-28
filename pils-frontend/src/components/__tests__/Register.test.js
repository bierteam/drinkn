import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Register from '../Register.vue'

const post = vi.hoisted(() => vi.fn())
const pwnedResult = vi.hoisted(() => ({ value: false }))

vi.mock('../../services/Api', () => ({
  default: () => ({ post })
}))

vi.mock('../../services/pwned', () => ({
  default: async () => pwnedResult.value
}))

const fill = (wrapper, { username = 'nino', password = 'a-good-one', admin = false } = {}) => {
  wrapper.vm.username = username
  wrapper.vm.password = password
  wrapper.vm.admin = admin
}

beforeEach(() => {
  post.mockReset()
  pwnedResult.value = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('shouldDisableButton', () => {
  it('blocks until both fields are filled', async () => {
    const wrapper = mount(Register)
    expect(wrapper.vm.shouldDisableButton).toBe(true)

    fill(wrapper)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.shouldDisableButton).toBe(false)
  })

  it('blocks a breached password even when both fields are filled', async () => {
    const wrapper = mount(Register)
    fill(wrapper)
    wrapper.vm.isPwned = true
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.shouldDisableButton).toBe(true)
  })
})

describe('checkPwned', () => {
  it('records a breached password', async () => {
    pwnedResult.value = true
    const wrapper = mount(Register)
    await wrapper.vm.checkPwned('hunter2')

    expect(wrapper.vm.isPwned).toBe(true)
  })

  it('clears the flag for a clean password', async () => {
    const wrapper = mount(Register)
    wrapper.vm.isPwned = true
    await wrapper.vm.checkPwned('a-good-one')

    expect(wrapper.vm.isPwned).toBe(false)
  })
})

describe('registerAccount', () => {
  it('posts the new account and confirms', async () => {
    post.mockResolvedValue({ status: 201 })
    const wrapper = mount(Register)
    fill(wrapper, { admin: true })
    await wrapper.vm.registerAccount()

    expect(post).toHaveBeenCalledWith('/api/v1/users/register', {
      username: 'nino',
      password: 'a-good-one',
      admin: true
    })
    expect(wrapper.vm.message).toBe('Created nino')
  })

  it('treats a 200 as a rejection and shows the body', async () => {
    post.mockResolvedValue({ status: 200, data: 'Username already taken' })
    const wrapper = mount(Register)
    fill(wrapper)
    await wrapper.vm.registerAccount()

    expect(wrapper.vm.error).toBe('Username already taken')
    expect(wrapper.vm.message).toBe('')
  })

  it('does nothing while the form is incomplete', async () => {
    const wrapper = mount(Register)
    wrapper.vm.username = 'nino'
    await wrapper.vm.registerAccount()

    expect(post).not.toHaveBeenCalled()
  })

  it('refuses to submit a breached password', async () => {
    const wrapper = mount(Register)
    fill(wrapper)
    wrapper.vm.isPwned = true
    await wrapper.vm.registerAccount()

    expect(post).not.toHaveBeenCalled()
  })

  it('surfaces the server message on failure', async () => {
    post.mockRejectedValue({ response: { data: 'Forbidden' } })
    const wrapper = mount(Register)
    fill(wrapper)
    await wrapper.vm.registerAccount()

    expect(wrapper.vm.error).toBe('Forbidden')
  })

  it('falls back to the error message when there is no response body', async () => {
    post.mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(Register)
    fill(wrapper)
    await wrapper.vm.registerAccount()

    expect(wrapper.vm.error).toBe('Network Error')
  })
})
