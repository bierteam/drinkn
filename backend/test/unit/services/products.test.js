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

  it('rejects a search term carrying regex metacharacters outright', async () => {
    const { service, product } = load()
    stubFind(product)

    await service.products({ search: 'a.*(b' })

    // no clause at all rather than a clause built from it
    const [filter] = product.find.mock.calls[0]
    expect(filter.$and).toBeUndefined()
  })

  it('escapes the punctuation a real beer name does contain', async () => {
    const { service, product } = load()
    stubFind(product)

    // "Hertog Jan 0.0" is a real product, so dots have to survive validation --
    // and then be matched literally rather than as "any character"
    await service.products({ search: 'Hertog Jan 0.0' })

    const [filter] = product.find.mock.calls[0]
    const pattern = new RegExp(filter.$and[0].$or[0].brand.$regex, 'i')
    expect(pattern.test('Hertog Jan 0.0')).toBe(true)
    expect(pattern.test('Hertog Jan 000')).toBe(false)
  })

  it('bounds how long a search term can be', async () => {
    const { service, product } = load()
    stubFind(product)

    await service.products({ search: 'a'.repeat(5000) })

    const [filter] = product.find.mock.calls[0]
    expect(filter.$and[0].$or[0].brand.$regex.length).toBeLessThanOrEqual(60)
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
  it('ignores a store filter that is not a plain string', async () => {
    const { service, product } = load()
    stubFind(product)

    // `?store[$ne]=x` under an extended query parser arrives as an object, and
    // assigning it straight onto the filter hands the caller a Mongo operator
    await service.products({ store: { $ne: 'nothing' } })

    const [filter] = product.find.mock.calls[0]
    expect(filter.store).toBeUndefined()
  })

  it('ignores a search term that is not a plain string', async () => {
    const { service, product } = load()
    stubFind(product)

    await service.products({ search: { $gt: '' } })

    const [filter] = product.find.mock.calls[0]
    expect(filter.$and).toBeUndefined()
  })

  it('ignores a sort field that is not a plain string', async () => {
    const { service, product } = load()
    const query = stubFind(product)

    await service.products({ sort: { $where: '1' } })

    expect(query.sort).toHaveBeenCalledWith({ 'price.literPrice': 1, _id: 1 })
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
