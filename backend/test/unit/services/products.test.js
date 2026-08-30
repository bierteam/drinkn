jest.mock('../../../models/product', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  distinct: jest.fn(),
  estimatedDocumentCount: jest.fn()
}))

// products.js reads process.env.PR at module load, like discount.js does
const load = (env = {}) => {
  const original = process.env.PR
  jest.resetModules()
  if (env.PR) process.env.PR = env.PR
  else delete process.env.PR

  const product = require('../../../models/product')
  const service = require('../../../services/products')

  if (original === undefined) delete process.env.PR
  else process.env.PR = original

  return { service, product }
}

const stubFind = (product, items = []) => {
  const query = {
    sort: jest.fn(() => query),
    skip: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(items)
  }
  product.find.mockReturnValue(query)
  product.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(items.length) })
  return query
}

describe('products', () => {
  it('pages the result instead of returning the whole collection', async () => {
    const { service, product } = load()
    const query = stubFind(product)

    await service.products({ page: '2', limit: '25' })

    expect(query.skip).toHaveBeenCalledWith(50)
    expect(query.limit).toHaveBeenCalledWith(25)
  })

  it('caps the page size a caller can ask for', async () => {
    const { service, product } = load()
    const query = stubFind(product)

    await service.products({ limit: '100000' })

    expect(query.limit).toHaveBeenCalledWith(200)
  })

  it('falls back to defaults for nonsense paging values', async () => {
    const { service, product } = load()
    const query = stubFind(product)

    await service.products({ page: 'abc', limit: '-5' })

    expect(query.skip).toHaveBeenCalledWith(0)
    expect(query.limit).toHaveBeenCalledWith(1)
  })

  it('returns every product by default, not only the discounted ones', async () => {
    const { service, product } = load()
    stubFind(product)

    await service.products({})

    const [filter] = product.find.mock.calls[0]
    expect(filter.isDiscounted).toBeUndefined()
  })

  it('excludes expired offers when asked for discounts only', async () => {
    const { service, product } = load()
    stubFind(product)

    await service.products({ onlyDiscounted: 'true' })

    const [filter] = product.find.mock.calls[0]
    expect(filter.isDiscounted).toBe(true)
    expect(filter.$or[0]['discount.endsAt'].$gte).toBeInstanceOf(Date)
  })

  it('keeps expired fixture offers visible on preview builds', async () => {
    const { service, product } = load({ PR: '1' })
    stubFind(product)

    await service.products({ onlyDiscounted: 'true' })

    const [filter] = product.find.mock.calls[0]
    expect(filter.isDiscounted).toBe(true)
    expect(filter.$or).toBeUndefined()
  })

  it('escapes a search term so it cannot be injected as a regex', async () => {
    const { service, product } = load()
    stubFind(product)

    await service.products({ search: 'a.*(b' })

    const [filter] = product.find.mock.calls[0]
    const pattern = filter.$and[0].$or[0].brand
    expect(pattern.test('a.*(b')).toBe(true)
    // an unescaped '.*' would match this too
    expect(pattern.test('axxxb')).toBe(false)
  })

  it('only sorts on fields it knows about', async () => {
    const { service, product } = load()
    const query = stubFind(product)

    await service.products({ sort: 'price.current; drop everything' })

    expect(query.sort).toHaveBeenCalledWith({ 'price.literPrice': 1, _id: 1 })
  })

  it('hides products with no litre price when sorting by it', async () => {
    const { service, product } = load()
    stubFind(product)

    await service.products({ sort: 'literPrice' })

    // null sorts before every number in Mongo, so these would otherwise fill
    // the first page of the default sort
    const [filter] = product.find.mock.calls[0]
    expect(filter['price.literPrice']).toEqual({ $ne: null })
  })

  it('reports the totals a pager needs', async () => {
    const { service, product } = load()
    stubFind(product, [{ _id: 1 }, { _id: 2 }])

    const result = await service.products({ limit: '1' })

    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(2)
  })
})

describe('facets', () => {
  it('lists every store, not just those on the current page', async () => {
    const { service, product } = load()
    product.distinct.mockReturnValue({ exec: jest.fn().mockResolvedValue(['Jumbo', 'Albert Heijn', '']) })
    product.estimatedDocumentCount.mockReturnValue({ exec: jest.fn().mockResolvedValue(900) })
    product.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(300) })

    const result = await service.facets()

    expect(result.stores).toEqual(['Albert Heijn', 'Jumbo'])
    expect(result.total).toBe(900)
    expect(result.discounted).toBe(300)
  })
})
