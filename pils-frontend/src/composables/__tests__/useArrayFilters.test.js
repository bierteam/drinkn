import { describe, it, expect } from 'vitest'
import { filterBy, orderBy } from '../useArrayFilters.js'

const discounts = [
  { id: 'a', brand: 'Alfa', store: 'AH', volume: '500ml', uri: 'https://ah.nl/a', literPrice: 200, pricing: { newPrice: 100, oldPrice: 200 } },
  { id: 'b', brand: 'brand', store: 'Jumbo', volume: '330ml', uri: null, literPrice: 500, pricing: { newPrice: 150, oldPrice: 300 } },
  { id: 'c', brand: 'Clausthaler', store: 'AH', volume: '500ml', uri: 'https://ah.nl/c', literPrice: 400, pricing: { newPrice: 200, oldPrice: 400 } },
  { id: 'd', brand: 'Alfa', store: 'Plus', volume: '750ml', uri: undefined, literPrice: 100, pricing: { newPrice: 75, oldPrice: 150 } }
]

describe('filterBy', () => {
  it('matches on any nested value, case-insensitively', () => {
    expect(filterBy(discounts, 'AH').map(d => d.id)).toEqual(['a', 'c'])
    expect(filterBy(discounts, 'alfa').map(d => d.id)).toEqual(['a', 'd'])
    expect(filterBy(discounts, '500ml').map(d => d.id)).toEqual(['a', 'c'])
  })

  it('descends into nested objects', () => {
    // 75 only appears under pricing
    expect(filterBy(discounts, '75').map(d => d.id)).toEqual(['d'])
  })

  it('returns everything for an empty search', () => {
    expect(filterBy(discounts, '')).toHaveLength(discounts.length)
  })

  it('returns the list untouched for null or undefined', () => {
    expect(filterBy(discounts, null)).toBe(discounts)
    expect(filterBy(discounts, undefined)).toBe(discounts)
  })

  it('survives a non-array input', () => {
    expect(filterBy(undefined, 'x')).toEqual([])
  })
})

describe('orderBy', () => {
  it('sorts ascending and descending', () => {
    expect(orderBy(discounts, 'literPrice', 1).map(d => d.id)).toEqual(['d', 'a', 'c', 'b'])
    expect(orderBy(discounts, 'literPrice', -1).map(d => d.id)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('compares strings case-insensitively', () => {
    // 'brand' and 'Alfa' must not sort by raw char code
    expect(orderBy(discounts, 'brand', 1).map(d => d.brand)).toEqual(['Alfa', 'Alfa', 'brand', 'Clausthaler'])
  })

  it('does not mutate the input', () => {
    const before = discounts.map(d => d.id)
    orderBy(discounts, 'literPrice', -1)
    expect(discounts.map(d => d.id)).toEqual(before)
  })

  it('returns the list untouched without a key', () => {
    expect(orderBy(discounts, '', 1)).toBe(discounts)
  })
})
