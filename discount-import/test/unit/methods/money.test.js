const { toCents, centsPerLitre } = require('../../../services/money')

test('parses both decimal separators the sources use', () => {
  expect(toCents('1.99')).toBe(199)
  expect(toCents('1,99')).toBe(199)
  expect(toCents(1.99)).toBe(199)
})

test('rounds away the float error the old importer stored', () => {
  // `9.28 * 100` is 927.9999999999999, which is in the preview fixture verbatim
  expect(toCents('9.28')).toBe(928)
  expect(Number.isInteger(toCents('9.28'))).toBe(true)
})

test('returns null for a missing price rather than zero', () => {
  // zero would read as "free" and sort to the top of a price-ascending list
  expect(toCents('')).toBeNull()
  expect(toCents(null)).toBeNull()
  expect(toCents(undefined)).toBeNull()
  expect(toCents('n/a')).toBeNull()
})

test('computes a litre price in cents', () => {
  expect(centsPerLitre(1499, 5000)).toBe(300)
  expect(centsPerLitre(698, 1800)).toBe(388)
})

test('refuses to divide by an unknown or zero volume', () => {
  expect(centsPerLitre(199, null)).toBeNull()
  expect(centsPerLitre(199, 0)).toBeNull()
  expect(centsPerLitre(null, 500)).toBeNull()
})
