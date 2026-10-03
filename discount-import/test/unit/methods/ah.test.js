const ah = require('../../../sources/ah')
const fixtures = require('../fixtures/ah-products.json')

// Captured from a live category walk. Each entry is one of the four payload
// shapes AH actually emits, which are not documented anywhere and are not
// guessable from the field names.

test('reads the shelf price of a product that is not on offer', () => {
  // AH leaves `currentPrice` null and puts the shelf price in `priceBeforeBonus`
  // when nothing is discounted. Reading `currentPrice` alone drops every
  // non-discounted beer -- 135 of 400 in the sample this fixture came from,
  // which is the entire point of showing all beers rather than just offers.
  const result = ah.normalise(fixtures.plainShelfPrice)
  expect(result.price.current).toBe(169)
  expect(result.isDiscounted).toBe(false)
  // nothing to strike through when there is no discount
  expect(result.price.base).toBeNull()
})

test('reads both prices of a product on offer', () => {
  const result = ah.normalise(fixtures.bonusMultipack)
  expect(result.price.current).toBe(749)
  expect(result.price.base).toBe(999)
  expect(result.isDiscounted).toBe(true)
  expect(result.discount.endsAt).toBeInstanceOf(Date)
})

test('does not mark a multi-buy mechanic as a lower price', () => {
  // flagged isBonus with no `currentPrice`: "2e halve prijs" and similar, where
  // the per-item shelf price is unchanged. 6 of 400 in the sample.
  const result = ah.normalise(fixtures.bonusWithoutLowerPrice)
  expect(result.price.current).toBe(649)
  expect(result.isDiscounted).toBe(false)
  expect(result.price.base).toBeNull()
})

test('leaves the litre price unset when no volume is published', () => {
  const result = ah.normalise(fixtures.countOnlyNoVolume)
  expect(result.totalMl).toBeNull()
  expect(result.price.literPrice).toBeNull()
  // the product is still worth showing, just not sortable by litre price
  expect(result.price.current).toBe(1498)
})

test('derives the litre price from the discounted price, not the normal one', () => {
  // AH's prose unit price says "normale prijs per liter" on a discounted
  // product, so trusting it there would advertise the undiscounted rate
  const result = ah.normalise(fixtures.bonusMultipack)
  expect(result.price.literPrice).toBe(416) // 749c / 1800ml
})

test('keys every record to its source', () => {
  const result = ah.normalise(fixtures.bonusMultipack)
  expect(result.source).toBe('ah')
  expect(result.sourceId).toBe(String(fixtures.bonusMultipack.webshopId))
  expect(result.rawStore).toBe('albert heijn')
})
