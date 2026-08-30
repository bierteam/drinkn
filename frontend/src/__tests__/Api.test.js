import { describe, it, expect, vi, beforeEach } from 'vitest'
import { store } from '../store.js'
import { Router } from '../router.js'
import Api from '../services/Api.js'

// capture the rejection handler Api.js registers so we can drive it directly.
// hoisted because vi.mock factories are lifted above plain const declarations
const handlers = vi.hoisted(() => ({}))
const axiosGet = vi.hoisted(() => vi.fn())
const clientRequest = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: {
    get: axiosGet,
    create: () => ({
      request: clientRequest,
      interceptors: {
        request: {
          use: onFulfilled => { handlers.onRequest = onFulfilled }
        },
        response: {
          use: (onFulfilled, onRejected) => { handlers.onRejected = onRejected }
        }
      }
    })
  }
}))

vi.mock('../router.js', () => ({
  Router: {
    currentRoute: { value: { path: '/account', fullPath: '/account?tab=otp' } },
    push: vi.fn()
  }
}))

describe('Api', () => {
  beforeEach(() => {
    Router.push.mockClear()
    axiosGet.mockReset().mockResolvedValue({ data: { token: 'csrf-1' } })
    clientRequest.mockReset().mockResolvedValue({ status: 200 })
    store.setAuthenticated('user-1')
  })

  it('hands every call site the same client', () => {
    // each call used to build a throwaway instance, so there was nowhere
    // shared to hang the interceptor below
    expect(Api()).toBe(Api())
  })

  it('registers a response interceptor', () => {
    expect(typeof handlers.onRejected).toBe('function')
  })

  it('logs out and redirects on a 401', async () => {
    await expect(handlers.onRejected({ response: { status: 401 } })).rejects.toBeTruthy()

    expect(store.isAuthenticated).toBe(false)
    expect(Router.push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/account?tab=otp' }
    })
  })

  it('leaves other failures alone', async () => {
    await expect(handlers.onRejected({ response: { status: 500 } })).rejects.toBeTruthy()

    expect(store.isAuthenticated).toBe(true)
    expect(Router.push).not.toHaveBeenCalled()
  })

  it('survives a network error with no response at all', async () => {
    await expect(handlers.onRejected(new Error('Network Error'))).rejects.toBeTruthy()

    expect(store.isAuthenticated).toBe(true)
    expect(Router.push).not.toHaveBeenCalled()
  })
})

describe('csrf', () => {
  // Api.js caches the token in module scope, so each test re-imports it
  const freshApi = async () => {
    vi.resetModules()
    delete handlers.onRequest
    delete handlers.onRejected
    await import('../services/Api.js')
    return handlers
  }

  beforeEach(() => {
    axiosGet.mockReset().mockResolvedValue({ data: { token: 'csrf-1' } })
    clientRequest.mockReset().mockResolvedValue({ status: 200 })
  })

  it('leaves a read alone, so no token is fetched to load a page', async () => {
    const handlers = await freshApi()
    const config = await handlers.onRequest({ method: 'get', headers: {} })

    expect(config.headers['X-CSRF-Token']).toBe(undefined)
    expect(axiosGet).not.toHaveBeenCalled()
  })

  it('stamps a token on anything that changes state', async () => {
    const handlers = await freshApi()
    const config = await handlers.onRequest({ method: 'post', headers: {} })

    expect(axiosGet).toHaveBeenCalledWith('/api/v1/csrf')
    expect(config.headers['X-CSRF-Token']).toBe('csrf-1')
  })

  it('covers deletes too', async () => {
    const handlers = await freshApi()
    const config = await handlers.onRequest({ method: 'delete', headers: {} })

    expect(config.headers['X-CSRF-Token']).toBe('csrf-1')
  })

  it('treats a missing method as a read rather than stamping it', async () => {
    const handlers = await freshApi()
    const config = await handlers.onRequest({ headers: {} })

    expect(config.headers['X-CSRF-Token']).toBe(undefined)
  })

  it('fetches the token once and reuses it', async () => {
    const handlers = await freshApi()
    await handlers.onRequest({ method: 'post', headers: {} })
    await handlers.onRequest({ method: 'post', headers: {} })
    await handlers.onRequest({ method: 'delete', headers: {} })

    expect(axiosGet).toHaveBeenCalledTimes(1)
  })

  it('shares one request when several calls start at once', async () => {
    const handlers = await freshApi()
    await Promise.all([
      handlers.onRequest({ method: 'post', headers: {} }),
      handlers.onRequest({ method: 'post', headers: {} }),
      handlers.onRequest({ method: 'post', headers: {} })
    ])

    expect(axiosGet).toHaveBeenCalledTimes(1)
  })

  it('refreshes a stale token on a 403 and replays the call once', async () => {
    const handlers = await freshApi()
    await handlers.onRequest({ method: 'post', headers: {} })
    axiosGet.mockResolvedValue({ data: { token: 'csrf-2' } })

    const config = { method: 'post', headers: {} }
    await handlers.onRejected({ response: { status: 403 }, config })

    expect(config.headers['X-CSRF-Token']).toBe('csrf-2')
    expect(clientRequest).toHaveBeenCalledWith(config)
  })

  it('gives up after one replay rather than looping', async () => {
    const handlers = await freshApi()
    const config = { method: 'post', headers: {}, _csrfRetried: true }

    await expect(handlers.onRejected({ response: { status: 403 }, config })).rejects.toBeTruthy()

    expect(clientRequest).not.toHaveBeenCalled()
  })
})
