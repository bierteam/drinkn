const { convert } = require('../../../migrations/001-beers-to-products')

// a row exactly as it sits in the `beers` collection today, taken from the
// preview fixture including its float-cent price
const legacyBeer = {
  id: 'e25e779507',
  brand: 'Grolsch Premium Pilsner',
  store: 'Jumbo',
  rawStore: 'JUMBO',
  pricing: {
    rawOldPrice: '9.28',
    rawNewPrice: '6.98',
    oldPrice: 927.9999999999999,
    newPrice: 698,
    literPrice: 3.8777777777777778
  },
  volume: 'set 4x0,45',
  validity: new Date('2023-08-15T22:00:00.000Z'),
  importDate: new Date('2023-08-06T20:26:25.025Z'),
  color: 'Blond',
  alcoholPercentage: 500,
  liter: 1800
}

test('repairs the float cents instead of carrying them over', () => {
  expect(convert(legacyBeer).price.base).toBe(928)
})

test('restates the litre price in cents like every other amount', () => {
  // it was stored in euros, next to prices in cents, and the view divided some
  // fields by 100 and not others to compensate
  expect(convert(legacyBeer).price.literPrice).toBe(388)
})

test('restores the alcohol percentage to a percentage', () => {
  expect(convert(legacyBeer).alcoholPercentage).toBe(5)
})

test('attributes every migrated row to biernet', () => {
  const result = convert(legacyBeer)
  expect(result.source).toBe('biernet')
  expect(result.sourceId).toBe('e25e779507')
  expect(result.isDiscounted).toBe(true)
})

test('carries the validity across as the offer end date', () => {
  expect(convert(legacyBeer).discount.endsAt).toEqual(legacyBeer.validity)
})

test('preserves both the raw and the canonical store name', () => {
  const result = convert(legacyBeer)
  expect(result.store).toBe('Jumbo')
  expect(result.rawStore).toBe('JUMBO')
})

test('is a pure function of the row, so it can be re-run safely', () => {
  expect(convert(legacyBeer)).toEqual(convert(legacyBeer))
})
