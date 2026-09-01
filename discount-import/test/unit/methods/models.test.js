const product = require('../../../models/product')
const priceObservation = require('../../../models/priceObservation')

test('a product can exist without any discount at all', () => {
  // the whole point: `beer` requires an old price, a new price and a validity,
  // so a beer at its normal shelf price could not be stored
  const doc = new product({
    source: 'ah',
    sourceId: '1',
    brand: 'Brouwers',
    store: 'Albert Heijn',
    price: { current: 169 },
    firstSeenAt: new Date(),
    lastSeenAt: new Date()
  })

  expect(doc.validateSync()).toBeUndefined()
  expect(doc.isDiscounted).toBe(false)
})

test('a product still needs an identity, a price and a store', () => {
  const doc = new product({ brand: 'Alfa' })
  const error = doc.validateSync()

  // keyed by the literal dotted path, so read them off directly rather than
  // letting toHaveProperty walk 'price.current' as two levels
  expect(Object.keys(error.errors).sort()).toEqual(
    ['firstSeenAt', 'lastSeenAt', 'price.current', 'source', 'sourceId', 'store']
  )
})

test('products are unique per source and source id', () => {
  const unique = product.schema.indexes().find(([keys]) => keys.source && keys.sourceId)

  expect(unique).toBeDefined()
  expect(unique[1].unique).toBe(true)
})

test('the read path has an index for the fields it filters on', () => {
  const keys = product.schema.indexes().map(([k]) => Object.keys(k).join(','))

  // `beer` indexed none of the fields it queried, `validity` included
  expect(keys).toContain('isDiscounted,discount.endsAt')
  expect(keys).toContain('store')
})

test('a price observation records what a product cost when', () => {
  const doc = new priceObservation({
    productId: '507f1f77bcf86cd799439011',
    source: 'ah',
    store: 'Albert Heijn',
    price: 169,
    seenAt: new Date()
  })

  expect(doc.validateSync()).toBeUndefined()
})
