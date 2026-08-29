import { describe, it, expect, beforeEach } from 'vitest'
import { Router } from '../router.js'
import { store } from '../store.js'

describe('auth guard', () => {
  beforeEach(() => {
    store.logout()
  })

  it('sends an anonymous visitor to the login page', async () => {
    await Router.push('/account')
    expect(Router.currentRoute.value.path).toBe('/login')
  })

  it('remembers where the visitor was headed', async () => {
    // the guard used to return a bare /login, so the redirect Login.vue reads
    // was never set and everyone landed on /discounts after signing in
    await Router.push('/users')
    expect(Router.currentRoute.value.query.redirect).toBe('/users')
  })

  it('keeps the query string of the original destination', async () => {
    await Router.push('/discounts?store=AH&zero=false')
    expect(Router.currentRoute.value.query.redirect).toBe('/discounts?store=AH&zero=false')
  })

  it('does not bounce the login page onto itself', async () => {
    await Router.push('/login')
    expect(Router.currentRoute.value.path).toBe('/login')
    expect(Router.currentRoute.value.query.redirect).toBe(undefined)
  })

  it('lets an authenticated visitor through', async () => {
    store.setAuthenticated('user-1')
    await Router.push('/account')
    expect(Router.currentRoute.value.path).toBe('/account')
  })
})
