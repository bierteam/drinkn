// the lazily loaded route components reach idb through services/db.js, which
// opens a database as soon as it is imported
import 'fake-indexeddb/auto'
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

// vue-router swaps the lazy loader out for the resolved component once a route
// has been visited, so the name is read through both shapes
const componentFor = async path => {
  const [record] = Router.resolve(path).matched
  const entry = record.components.default
  const component = typeof entry === 'function' ? (await entry()).default : entry
  return component.name
}

describe('discounts route', () => {
  beforeEach(() => {
    store.setAuthenticated('user-1')
  })

  it('serves the discounts component', async () => {
    expect(await componentFor('/discounts')).toBe('Discounts')
  })

  it('keeps the filters that arrive in the query string', async () => {
    await Router.push('/discounts?store=AH&zero=false')
    expect(Router.currentRoute.value.path).toBe('/discounts')
    expect(Router.currentRoute.value.query.store).toBe('AH')
  })

  it('sends the bare root there too', async () => {
    await Router.push('/')
    expect(Router.currentRoute.value.path).toBe('/discounts')
  })
})
