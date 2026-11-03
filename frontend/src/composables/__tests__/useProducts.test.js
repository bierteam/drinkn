import { describe, it, expect, vi } from 'vitest'
import { formatCents, discountPercentage, useProducts } from '../useProducts.js'

const page = () => ({ items: [{ _id: 'a' }, { _id: 'b' }], total: 2, totalPages: 1, page: 0 })

let getFails = false
const get = vi.fn(async () => {
  if (getFails) throw new Error('offline')
  return { data: page() }
})

vi.mock('../../services/Api', () => ({ default: () => ({ get: (...args) => get(...args) }) }))

describe('formatCents', () => {
  it('renders every amount from cents, litre price included', () => {
    // the /discounts payload mixed units: prices in cents, literPrice in euros
    expect(formatCents(388)).toContain('3,88')
    expect(formatCents(1499)).toContain('14,99')
  })

  it('returns null for an amount that is not there', () => {
    // a product with no published volume has no litre price, and rendering 0
    // would read as free
    expect(formatCents(null)).toBeNull()
    expect(formatCents(undefined)).toBeNull()
    expect(formatCents('nope')).toBeNull()
  })
})

describe('discountPercentage', () => {
  it('computes the saving against the pre-offer price', () => {
    expect(discountPercentage({ price: { current: 749, base: 999 } })).toBe(25)
  })

  it('returns null for a product at its normal price', () => {
    // the old decorate() divided by oldPrice unconditionally, so a record with
    // no base gave Infinity and sorted straight to the top
    expect(discountPercentage({ price: { current: 169, base: null } })).toBeNull()
    expect(discountPercentage({ price: { current: 169 } })).toBeNull()
    expect(discountPercentage({})).toBeNull()
  })

  it('returns null when the base is not actually higher', () => {
    expect(discountPercentage({ price: { current: 200, base: 200 } })).toBeNull()
    expect(discountPercentage({ price: { current: 300, base: 200 } })).toBeNull()
  })
})

describe('useProducts', () => {
  it('passes the filters to the API instead of filtering locally', async () => {
    getFails = false
    const { load, products, total } = useProducts()

    await load({ store: 'Jumbo', page: 2 })

    expect(get).toHaveBeenCalledWith('/api/v1/products', { params: { store: 'Jumbo', page: 2 } })
    expect(products.value).toHaveLength(2)
    expect(total.value).toBe(2)
  })

  it('surfaces a failure instead of showing an empty list as success', async () => {
    getFails = true
    const { load, error, loading } = useProducts()

    await load({})

    expect(error.value).toBeTruthy()
    expect(loading.value).toBe(false)
    getFails = false
  })
})
