const { productKey } = require('../../../services/productKey')

test('produces the same key for the same beer described two ways', () => {
  // how the two sources actually name one product
  const ah = productKey({ brand: 'Hertog Jan', title: 'Hertog Jan Pilsener bier krat', totalMl: 7200 })
  const biernet = productKey({ brand: 'Hertog Jan', title: '', totalMl: 7200 })
  expect(ah).toBe(biernet)
})

test('separates the same brand at different pack sizes', () => {
  expect(productKey({ brand: 'Corona', title: 'Corona Extra', totalMl: 5000 }))
    .not.toBe(productKey({ brand: 'Corona', title: 'Corona Extra', totalMl: 330 }))
})

test('collides on variants of one brand at one size', () => {
  // documenting the limit rather than pretending it away: this is exactly why
  // the key proposes candidates for review instead of merging records
  const pils = productKey({ brand: 'Hertog Jan', title: 'Hertog Jan Pilsener', totalMl: 7200 })
  const weizen = productKey({ brand: 'Hertog Jan', title: 'Hertog Jan', totalMl: 7200 })
  expect(pils).toBe(weizen)
})

test('returns null when there is no name to key on', () => {
  expect(productKey({ brand: '', title: '', totalMl: 500 })).toBeNull()
})
