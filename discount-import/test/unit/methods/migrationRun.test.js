jest.mock('../../../models/beer')
jest.mock('../../../models/product')

const beer = require('../../../models/beer')
const product = require('../../../models/product')
const { migrate, findDuplicates } = require('../../../migrations/001-beers-to-products')

const legacy = (over = {}) => ({
  id: 'abc123',
  brand: 'Alfa',
  store: 'Jumbo',
  pricing: { rawOldPrice: '2.00', rawNewPrice: '1.00', oldPrice: 200, newPrice: 100, literPrice: 2 },
  volume: 'set 4x0,45',
  liter: 1800,
  importDate: new Date('2026-08-01T00:00:00Z'),
  ...over
})

const stubCursor = docs => {
  beer.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(docs.length) })
  beer.find = jest.fn().mockReturnValue({
    lean: () => ({
      cursor: () => (async function* () {
        for (const doc of docs) yield doc
      })()
    })
  })
}

beforeEach(() => {
  product.bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 0, modifiedCount: 0 })
  product.aggregate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) })
})

describe('migrate', () => {
  it('writes nothing on a dry run', async () => {
    stubCursor([legacy(), legacy({ id: 'def456' })])

    const summary = await migrate({ dryRun: true })

    expect(product.bulkWrite).not.toHaveBeenCalled()
    expect(summary.processed).toBe(2)
    expect(summary.dryRun).toBe(true)
  })

  it('upserts on source and sourceId so a re-run is safe', async () => {
    stubCursor([legacy()])

    await migrate()

    const [operations] = product.bulkWrite.mock.calls[0]
    expect(operations[0].updateOne.filter).toEqual({ source: 'biernet', sourceId: 'abc123' })
    expect(operations[0].updateOne.upsert).toBe(true)
  })

  it('leaves the legacy collection alone', async () => {
    stubCursor([legacy()])

    await migrate()

    // rolling back has to be `db.products.drop()` and nothing else, so nothing
    // here may write to the legacy collection
    expect(beer.updateOne).not.toHaveBeenCalled()
    expect(beer.deleteMany).not.toHaveBeenCalled()
    expect(beer.bulkWrite).not.toHaveBeenCalled()
  })

  it('skips rows with nothing usable to carry forward', async () => {
    stubCursor([
      legacy(),
      legacy({ id: 'no-price', pricing: { newPrice: 0 } }),
      legacy({ id: 'no-store', store: '' })
    ])

    const summary = await migrate()

    expect(summary.skipped).toBe(2)
    expect(summary.processed).toBe(3)
  })

  it('reports duplicates that would stop the unique index building', async () => {
    stubCursor([legacy()])
    product.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([{ _id: { source: 'biernet', sourceId: 'abc123' }, count: 2 }])
    })

    const summary = await migrate()

    // mongoose swallows the index build failure, so nothing else would say so
    expect(summary.duplicates).toEqual(['biernet/abc123 x2'])
  })

  it('reports no duplicates for a clean collection', async () => {
    await expect(findDuplicates()).resolves.toEqual([])
  })
})
