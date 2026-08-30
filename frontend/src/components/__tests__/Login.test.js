import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Login from '../Login.vue'
import { store } from '../../store.js'

const post = vi.hoisted(() => vi.fn())
const get = vi.hoisted(() => vi.fn())
const startAuthentication = vi.hoisted(() => vi.fn())
const supported = vi.hoisted(() => ({ value: true }))

vi.mock('../../services/Api', () => ({
  default: () => ({ post, get })
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
  get.mockReset().mockResolvedValue({ status: 200, data: { enabled: false } })
  startAuthentication.mockReset()
  supported.value = true
  store.logout()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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

  it('explains a refused prompt and names the error, without signing in', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const cancelled = new Error('The operation either timed out or was not allowed')
    cancelled.name = 'NotAllowedError'
    startAuthentication.mockRejectedValue(cancelled)
    const { wrapper, push } = mountLogin()
    await wrapper.vm.Passkey()

    expect(wrapper.vm.error).toContain('No passkey was offered')
    expect(wrapper.vm.error).toContain('password manager')
    expect(push).not.toHaveBeenCalled()
  })

  it('writes the whole error shape to the console', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const wrapped = new Error('the manager gave up')
    wrapped.name = 'NotAllowedError'
    wrapped.code = 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY'
    wrapped.cause = Object.assign(new Error('underlying'), { name: 'NotAllowedError' })
    startAuthentication.mockRejectedValue(wrapped)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper } = mountLogin()
    await wrapper.vm.Passkey()

    expect(spy).toHaveBeenCalledWith('[passkey] authentication', {
      name: 'NotAllowedError',
      code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
      message: 'the manager gave up',
      causeName: 'NotAllowedError',
      causeMessage: 'underlying'
    }, wrapped)
    spy.mockRestore()
  })

  it('surfaces a server refusal', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    startAuthentication.mockResolvedValue({ id: 'cred-1' })
    post.mockRejectedValueOnce({ response: { data: 'That passkey was not accepted' } })
    const { wrapper } = mountLogin()
    await wrapper.vm.Passkey()

    expect(wrapper.vm.error).toContain('That passkey was not accepted')
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

describe('preview banner', () => {
  it('stays hidden outside a preview namespace', async () => {
    const { wrapper } = mountLogin()
    await flushPromises()

    expect(wrapper.vm.preview.enabled).toBe(false)
    expect(wrapper.text()).not.toContain('Preview environment')
  })

  it('shows the throwaway credentials inside one', async () => {
    get.mockResolvedValue({ status: 200, data: { enabled: true, username: 'test', password: 'test' } })
    const { wrapper } = mountLogin()
    await flushPromises()

    expect(wrapper.text()).toContain('Preview environment')
    expect(wrapper.text()).toContain('test')
  })

  it('fills the form on request', async () => {
    get.mockResolvedValue({ status: 200, data: { enabled: true, username: 'test', password: 'hunter2' } })
    const { wrapper } = mountLogin()
    await flushPromises()

    wrapper.vm.FillPreview()

    expect(wrapper.vm.username).toBe('test')
    expect(wrapper.vm.password).toBe('hunter2')
    expect(wrapper.vm.isDisabled).toBe(false)
  })

  it('never blocks signing in when the lookup fails', async () => {
    get.mockRejectedValue(new Error('Network Error'))
    const { wrapper } = mountLogin()
    await flushPromises()

    expect(wrapper.vm.preview.enabled).toBe(false)
    expect(wrapper.vm.error).toBe('')
  })
})

describe('a password manager handing the ceremony over', () => {
  it('says nothing on an abort, rather than claiming it was cancelled', async () => {
    // Bitwarden aborts its own overlay; the old branch called that a cancel
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const handoff = new Error('aborted')
    handoff.name = 'AbortError'
    startAuthentication.mockRejectedValue(handoff)
    const { wrapper } = mountLogin()
    await wrapper.vm.Passkey()

    expect(wrapper.vm.message).toBe('')
    expect(wrapper.vm.error).toBe('')
    expect(wrapper.vm.passkeyBusy).toBe(false)
  })

  it('still logs the abort, so it is visible if it was not a handoff', async () => {
    post.mockResolvedValueOnce({ status: 200, data: { challenge: 'abc' } })
    const handoff = new Error('aborted')
    handoff.name = 'AbortError'
    startAuthentication.mockRejectedValue(handoff)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper } = mountLogin()
    await wrapper.vm.Passkey()

    expect(spy).toHaveBeenCalledWith('[passkey] authentication',
      expect.objectContaining({ name: 'AbortError' }), handoff)
    spy.mockRestore()
  })
})

describe('single sign-on', () => {
  // one mock serves several endpoints in this flow, so answer by url
  const answering = (routes = {}) => get.mockImplementation(url => {
    const answer = routes[url]
    if (answer instanceof Error) return Promise.reject(answer)
    if (answer) return Promise.resolve({ status: 200, data: answer })
    return Promise.resolve({ status: 200, data: { enabled: false } })
  })

  const button = wrapper => wrapper.findAll('button').find(node => node.text().startsWith('Sign in with'))

  it('offers the issuer once the backend says it is configured', async () => {
    answering({ '/api/v1/users/login/oidc/enabled': { enabled: true, name: 'auth.oscarr.nl' } })
    const { wrapper } = mountLogin()
    await flushPromises()

    expect(button(wrapper).text()).toBe('Sign in with auth.oscarr.nl')
  })

  it('offers nothing when it is not configured', async () => {
    answering()
    const { wrapper } = mountLogin()
    await flushPromises()

    expect(button(wrapper)).toBeUndefined()
  })

  it('does not let a failed lookup take the password form with it', async () => {
    answering({ '/api/v1/users/login/oidc/enabled': new Error('Network Error') })
    const { wrapper } = mountLogin()
    await flushPromises()

    expect(wrapper.vm.sso.enabled).toBe(false)
    expect(wrapper.find('#login-password').exists()).toBe(true)
  })

  it('leaves the page for the backend, carrying the remember flag', async () => {
    answering({ '/api/v1/users/login/oidc/enabled': { enabled: true, name: 'auth.oscarr.nl' } })
    const assign = vi.fn()
    // jsdom refuses to let assign be redefined, so stand in the whole location
    vi.stubGlobal('location', { assign })
    const { wrapper } = mountLogin()
    await flushPromises()

    wrapper.vm.remember = false
    await button(wrapper).trigger('click')

    expect(assign).toHaveBeenCalledWith('/api/v1/users/login/oidc?remember=false')
  })

  it('passes the redirect the guard left behind', async () => {
    answering({ '/api/v1/users/login/oidc/enabled': { enabled: true, name: 'auth.oscarr.nl' } })
    const assign = vi.fn()
    // jsdom refuses to let assign be redefined, so stand in the whole location
    vi.stubGlobal('location', { assign })
    const { wrapper } = mountLogin({ redirect: '/users' })
    await flushPromises()

    wrapper.vm.SsoLogin()

    expect(assign).toHaveBeenCalledWith('/api/v1/users/login/oidc?remember=true&redirect=%2Fusers')
  })

  it('fills the store from the session on the way back', async () => {
    answering({ '/api/v1/users/session': { _id: 'user-1', username: 'oscar', admin: true } })
    const { push } = mountLogin({ oidc: '1' })
    await flushPromises()

    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('user-1')
    expect(store.isAdmin).toBe(true)
    expect(push).toHaveBeenCalledWith('/discounts')
  })

  it('lands on the page the guard had wanted', async () => {
    answering({ '/api/v1/users/session': { _id: 'user-1' } })
    const { push } = mountLogin({ oidc: '1', redirect: '/users' })
    await flushPromises()

    expect(push).toHaveBeenCalledWith('/users')
  })

  it('shows the message the callback redirected back with', async () => {
    answering()
    const { wrapper } = mountLogin({ error: 'That sign-in was not accepted' })
    await flushPromises()

    expect(wrapper.vm.error).toBe('That sign-in was not accepted')
    expect(wrapper.find('.notification.is-danger').text()).toContain('That sign-in was not accepted')
  })

  it('says so when the session turns out not to be there', async () => {
    // the shape axios really throws: a 401 here carries the guard's own body,
    // which says nothing to whoever just came back from the issuer
    const refused = Object.assign(new Error('Request failed with status code 401'), {
      response: { status: 401, data: 'Thou shall not pass!' }
    })
    answering({ '/api/v1/users/session': refused })
    const { wrapper } = mountLogin({ oidc: '1' })
    await flushPromises()

    expect(wrapper.vm.error).toBe('That sign-in did not complete, try again')
    expect(store.isAuthenticated).toBe(false)
  })

  it('asks for nothing on a plain visit to the login page', async () => {
    answering()
    mountLogin()
    await flushPromises()

    expect(get).not.toHaveBeenCalledWith('/api/v1/users/session')
  })
})
