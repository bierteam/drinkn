import { describe, it, expect, vi, beforeEach } from 'vitest'
import { store } from '../store.js'
import { Router } from '../router.js'
import Api from '../services/Api.js'

// capture the rejection handler Api.js registers so we can drive it directly.
// hoisted because vi.mock factories are lifted above plain const declarations
const handlers = vi.hoisted(() => ({}))

vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
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
