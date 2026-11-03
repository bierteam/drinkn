const biernet = require('../../../sources/biernet')

const offer = {
  uid: '12345',
  merken_name: 'Grolsch Premium Pilsner',
  winkel_name: 'JUMBO',
  vanprijs: '9.28',
  voorprijs: '6.98',
  korte_name: 'set 4x0,45',
  aantal_liter: '1.8',
  einddatum: 'dinsdag 15 augustus',
  alcoholpercentage: '5.0',
  kleur: 'Blond'
}

test('maps a biernet offer onto the canonical shape', () => {
  const result = biernet.normalise(offer)
  expect(result.source).toBe('biernet')
  expect(result.sourceId).toBe('12345')
  expect(result.brand).toBe('Grolsch Premium Pilsner')
  expect(result.rawStore).toBe('JUMBO')
  expect(result.totalMl).toBe(1800)
})

test('stores prices as integer cents', () => {
  const result = biernet.normalise(offer)
  // the old importer stored 927.9999999999999 for this exact price
  expect(result.price.base).toBe(928)
  expect(result.price.current).toBe(698)
  expect(result.price.literPrice).toBe(388)
})

test('keeps the alcohol percentage as a percentage', () => {
  // the old importer stored 500 for a 5% beer and the view divided by 100 again
  expect(biernet.normalise(offer).alcoholPercentage).toBe(5)
})

test('marks every biernet record as discounted', () => {
  // biernet publishes offers and nothing else, so full-assortment coverage can
  // only ever come from a retailer source
  expect(biernet.normalise(offer).isDiscounted).toBe(true)
})

test('drops a record with no price or no store', () => {
  expect(biernet.normalise({ ...offer, voorprijs: '' })).toBeNull()
  expect(biernet.normalise({ ...offer, winkel_name: '' })).toBeNull()
  expect(biernet.normalise({ ...offer, merken_name: '' })).toBeNull()
})

test('falls back to the volume string when litres are missing', () => {
  const result = biernet.normalise({ ...offer, aantal_liter: undefined })
  expect(result.totalMl).toBe(1800)
})
