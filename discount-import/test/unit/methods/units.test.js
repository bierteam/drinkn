const { parseVolume, parseUnitPrice } = require('../../../services/units')

test('parses the multipack forms both sources emit', () => {
  expect(parseVolume('6 x 0,33 l')).toEqual({ packCount: 6, unitMl: 330, totalMl: 1980 })
  expect(parseVolume('4 x 0,25 l')).toEqual({ packCount: 4, unitMl: 250, totalMl: 1000 })
  // biernet leaves the unit off and means litres
  expect(parseVolume('set 8x0,50')).toEqual({ packCount: 8, unitMl: 500, totalMl: 4000 })
  expect(parseVolume('krat 24x0,30')).toEqual({ packCount: 24, unitMl: 300, totalMl: 7200 })
})

test('parses single items', () => {
  expect(parseVolume('5 l')).toEqual({ packCount: 1, unitMl: 5000, totalMl: 5000 })
  expect(parseVolume('330 ml')).toEqual({ packCount: 1, unitMl: 330, totalMl: 330 })
  expect(parseVolume('0,5 l')).toEqual({ packCount: 1, unitMl: 500, totalMl: 500 })
  expect(parseVolume('1,32 l')).toEqual({ packCount: 1, unitMl: 1320, totalMl: 1320 })
})

test('reports no volume for a bare count instead of guessing', () => {
  // roughly 40% of AH's beer assortment is sold as "N stuks", with no volume
  // published anywhere in the search payload. Guessing a bottle size here would
  // put a fabricated litre price next to real ones.
  expect(parseVolume('2 stuks')).toEqual({ packCount: null, unitMl: null, totalMl: null })
  expect(parseVolume('12 stuks')).toEqual({ packCount: null, unitMl: null, totalMl: null })
  expect(parseVolume('')).toEqual({ packCount: null, unitMl: null, totalMl: null })
  expect(parseVolume(null)).toEqual({ packCount: null, unitMl: null, totalMl: null })
})

test('reads the litre price AH writes as prose', () => {
  expect(parseUnitPrice('normale prijs per liter €4.00')).toBe(400)
  expect(parseUnitPrice('prijs per liter €2,35')).toBe(235)
  expect(parseUnitPrice('prijs per kilo €3.00')).toBeNull()
  expect(parseUnitPrice(null)).toBeNull()
})
