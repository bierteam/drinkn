const sources = require('../../../sources')

jest.mock('../../../sources', () => [])
jest.mock('../../../models/product')
jest.mock('../../../models/priceObservation')
jest.mock('../../../models/store')
jest.mock('../../../services/updateStores', () => jest.fn())
jest.mock('../../../services/writeLog', () => jest.fn())

const product = require('../../../models/product')
const priceObservation = require('../../../models/priceObservation')
const store = require('../../../models/store')
const updateStores = require('../../../services/updateStores')
const importProducts = require('../../../services/importProducts')

const record = (over = {}) => ({
  source: 'test',
  sourceId: '1',
  brand: 'Alfa',
  rawStore: 'albert heijn',
  price: { current: 199, base: null, literPrice: 398 },
  isDiscounted: false,
  discount: {},
  ...over
})

// a source that hands back whatever it is given, so the pipeline is what is
// under test rather than any particular adapter
const fakeSource = (name, records, over = {}) => ({
  name,
  enabled: () => true,
  fetch: jest.fn().mockResolvedValue(records),
  normalise: jest.fn(item => item),
  ...over
})

const useSources = list => {
  sources.length = 0
  sources.push(...list)
}

beforeEach(() => {
  useSources([])
  store.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _doc: { 'albert heijn': 'Albert Heijn' } }) })
  product.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) })
  product.findOneAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'p1' }) })
  priceObservation.create = jest.fn().mockResolvedValue({})
})

describe('importProducts', () => {
  it('applies the canonical store map the admin maintains', async () => {
    useSources([fakeSource('test', [record()])])

    await importProducts(new Date())

    const [, update] = product.findOneAndUpdate.mock.calls[0]
    expect(update.$set.store).toBe('Albert Heijn')
    expect(update.$set.rawStore).toBe('albert heijn')
  })

  it('keys the upsert on source and sourceId', async () => {
    useSources([fakeSource('test', [record()])])

    await importProducts(new Date())

    const [filter, , options] = product.findOneAndUpdate.mock.calls[0]
    expect(filter).toEqual({ source: 'test', sourceId: '1' })
    expect(options.upsert).toBe(true)
  })

  it('updates a record it has seen before instead of skipping it', async () => {
    // the old importer did `if (!existingBeer) create`, so a price could never
    // change once seen
    product.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ price: { current: 250 } }) })
    useSources([fakeSource('test', [record()])])

    await importProducts(new Date())

    expect(product.findOneAndUpdate).toHaveBeenCalled()
    const [, update] = product.findOneAndUpdate.mock.calls[0]
    expect(update.$set.price.current).toBe(199)
  })

  it('records history only when the price actually moved', async () => {
    product.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ price: { current: 199 } }) })
    useSources([fakeSource('test', [record()])])

    await importProducts(new Date())

    // a row per product per run would add roughly 700k rows a year to say
    // nothing happened
    expect(priceObservation.create).not.toHaveBeenCalled()
  })

  it('records history for a product it has never seen', async () => {
    useSources([fakeSource('test', [record()])])

    await importProducts(new Date())

    expect(priceObservation.create).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1', price: 199 }))
  })

  it('records history when the price changed', async () => {
    product.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ price: { current: 250 } }) })
    useSources([fakeSource('test', [record()])])

    await importProducts(new Date())

    expect(priceObservation.create).toHaveBeenCalled()
  })

  it('skips records the adapter cannot normalise', async () => {
    const source = fakeSource('test', [record(), record({ sourceId: '2' })])
    source.normalise = jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(record({ sourceId: '2' }))
    useSources([source])

    const summary = await importProducts(new Date())

    expect(summary[0]).toMatchObject({ imported: 1, skipped: 1 })
  })

  it('keeps going when one source fails', async () => {
    // getData() throws on any endpoint error, so before this a single biernet
    // hiccup aborted the entire import
    const broken = fakeSource('broken', [])
    broken.fetch = jest.fn().mockRejectedValue(new Error('biernet is down'))
    useSources([broken, fakeSource('working', [record()])])

    const summary = await importProducts(new Date())

    expect(summary[0]).toMatchObject({ source: 'broken', error: 'biernet is down' })
    expect(summary[1]).toMatchObject({ source: 'working', imported: 1 })
    expect(product.findOneAndUpdate).toHaveBeenCalledTimes(1)
  })

  it('does not run a source that is switched off', async () => {
    const off = fakeSource('off', [record()])
    off.enabled = () => false
    useSources([off])

    const summary = await importProducts(new Date())

    expect(off.fetch).not.toHaveBeenCalled()
    expect(summary).toEqual([])
  })

  it('reports store names it has not seen before for the admin to map', async () => {
    useSources([fakeSource('test', [record({ rawStore: 'Nieuwe Winkel' })])])

    await importProducts(new Date())

    expect(updateStores).toHaveBeenCalledWith(expect.objectContaining({ 'Nieuwe Winkel': 'Nieuwe Winkel' }))
  })

  it('leaves an unmapped store name as it found it', async () => {
    useSources([fakeSource('test', [record({ rawStore: 'Onbekend' })])])

    await importProducts(new Date())

    const [, update] = product.findOneAndUpdate.mock.calls[0]
    expect(update.$set.store).toBe('Onbekend')
  })

  it('stamps firstSeenAt only on insert', async () => {
    const now = new Date('2026-08-30T09:00:00Z')
    useSources([fakeSource('test', [record()])])

    await importProducts(now)

    const [, update] = product.findOneAndUpdate.mock.calls[0]
    expect(update.$setOnInsert.firstSeenAt).toBe(now)
    expect(update.$set.lastSeenAt).toBe(now)
  })
})
