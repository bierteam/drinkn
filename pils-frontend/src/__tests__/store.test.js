import { describe, it, expect, beforeEach, vi } from 'vitest'
import { store } from '../store.js'

beforeEach(() => {
  store.logout()
  localStorage.clear()
})

describe('store', () => {
  it('starts anonymous', () => {
    expect(store.isAuthenticated).toBe(false)
    expect(store.isAdmin).toBe(false)
    expect(store.userId).toBe(null)
  })

  it('records the user id on sign-in', () => {
    store.setAuthenticated('user-1')

    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('user-1')
    expect(localStorage.getItem('isAuthenticated')).toBe('user-1')
  })

  it('records the admin flag separately', () => {
    store.setAdmin()

    expect(store.isAdmin).toBe(true)
    expect(localStorage.getItem('isAdmin')).toBeTruthy()
  })

  it('clears everything on logout', () => {
    store.setAuthenticated('user-1')
    store.setAdmin()

    store.logout()

    expect(store.isAuthenticated).toBe(false)
    expect(store.userId).toBe(null)
    expect(localStorage.getItem('isAuthenticated')).toBe(null)
    expect(localStorage.getItem('isAdmin')).toBe(null)
  })

  it('rehydrates the session from localStorage on load', async () => {
    localStorage.setItem('isAuthenticated', 'user-7')
    localStorage.setItem('isAdmin', 'yes')

    // re-evaluate the module so its top-level init runs against the values above
    vi.resetModules()
    const fresh = (await import('../store.js')).store

    expect(fresh.isAuthenticated).toBe(true)
    expect(fresh.isAdmin).toBe(true)
    expect(fresh.userId).toBe('user-7')
  })

  it('stays anonymous when localStorage is empty on load', async () => {
    vi.resetModules()
    const fresh = (await import('../store.js')).store

    expect(fresh.isAuthenticated).toBe(false)
    expect(fresh.userId).toBe(null)
  })
})
