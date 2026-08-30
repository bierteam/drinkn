const request = require('supertest')
const { buildApp } = require('../helpers')

jest.mock('../../../services/isAuthenticated', () => (req, res, next) => next())
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/products', () => ({
  products: jest.fn(),
  facets: jest.fn()
}))

const service = require('../../../services/products')
const router = require('../../../api/v1/products')

const session = { username: 'tester', userId: 'u1' }

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('GET /products', () => {
  it('hands the query string to the service rather than filtering itself', async () => {
    service.products.mockResolvedValue({ items: [], total: 0, totalPages: 0, page: 0, limit: 60 })
    const { app } = buildApp('/api/v1', router, session)

    await request(app).get('/api/v1/products?store=Jumbo&page=2').expect(200)

    expect(service.products).toHaveBeenCalledWith(expect.objectContaining({ store: 'Jumbo', page: '2' }))
  })

  it('returns the paged envelope the view needs', async () => {
    const payload = { items: [{ _id: 'a' }], total: 1, totalPages: 1, page: 0, limit: 60 }
    service.products.mockResolvedValue(payload)
    const { app } = buildApp('/api/v1', router, session)

    const response = await request(app).get('/api/v1/products').expect(200)

    expect(response.body).toEqual(payload)
  })

  it('answers 500 rather than leaking the error when the query fails', async () => {
    service.products.mockRejectedValue(new Error('mongo down'))
    const { app } = buildApp('/api/v1', router, session)

    const response = await request(app).get('/api/v1/products').expect(500)

    expect(response.body).toEqual({ error: 'Server error' })
    expect(response.text).not.toContain('mongo down')
  })
})

describe('GET /products/facets', () => {
  it('returns the filter options', async () => {
    service.facets.mockResolvedValue({ stores: ['Albert Heijn'], total: 900, discounted: 300 })
    const { app } = buildApp('/api/v1', router, session)

    const response = await request(app).get('/api/v1/products/facets').expect(200)

    expect(response.body.stores).toEqual(['Albert Heijn'])
  })

  it('answers 500 when the facet query fails', async () => {
    service.facets.mockRejectedValue(new Error('mongo down'))
    const { app } = buildApp('/api/v1', router, session)

    await request(app).get('/api/v1/products/facets').expect(500)
  })
})
