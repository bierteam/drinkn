import { describe, it, expect } from 'vitest'
import { mergedQuery, sameQuery } from '../useQuerySync.js'

describe('sameQuery', () => {
  it('ignores key order', () => {
    expect(sameQuery({ a: '1', b: '2' }, { b: '2', a: '1' })).toBe(true)
  })

  it('compares values as strings', () => {
    // the router hands back strings, the components hold booleans and numbers
    expect(sameQuery({ online: 'true' }, { online: true })).toBe(true)
    expect(sameQuery({ page: '2' }, { page: 2 })).toBe(true)
  })

  it('sees a different value', () => {
    expect(sameQuery({ a: '1' }, { a: '2' })).toBe(false)
  })

  it('sees an added or removed key', () => {
    expect(sameQuery({ a: '1' }, { a: '1', b: '2' })).toBe(false)
    expect(sameQuery({ a: '1', b: '2' }, { a: '1' })).toBe(false)
  })

  it('treats two empty queries as the same', () => {
    expect(sameQuery({}, {})).toBe(true)
  })

  it('does not match on key count alone', () => {
    expect(sameQuery({ a: '1' }, { b: '1' })).toBe(false)
  })
})

describe('mergedQuery', () => {
  it('replaces the keys the page owns', () => {
    expect(mergedQuery({ search: 'old' }, ['search'], { search: 'new' })).toEqual({ search: 'new' })
  })

  it('clears an owned key that is no longer set', () => {
    expect(mergedQuery({ search: 'old', store: 'AH' }, ['search', 'store'], {})).toEqual({})
  })

  it('leaves parameters owned by anything else alone', () => {
    // a redirect target, for one, has to survive a filter change
    expect(mergedQuery({ redirect: '/users', search: 'old' }, ['search'], { search: 'new' }))
      .toEqual({ redirect: '/users', search: 'new' })
  })

  it('does not modify the query it was handed', () => {
    const current = { search: 'old' }
    mergedQuery(current, ['search'], {})
    expect(current).toEqual({ search: 'old' })
  })
})
