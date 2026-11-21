const { parseLidlVolume, packFromDeposit } = require('../../../scripts/lidlVolume')

describe('packFromDeposit', () => {
  test('reads the pack size out of a deposit label', () => {
    // the self-scan master has no volume field; the pack size is in the
    // statiegeld name, e.g. "24-pk blik st.geld"
    expect(packFromDeposit('24-pk blik st.geld')).toBe(24)
    expect(packFromDeposit('6-pk blik st.geld')).toBe(6)
    expect(packFromDeposit('18-pk blik st.geld')).toBe(18)
  })

  test('treats a loose item as a pack of one', () => {
    expect(packFromDeposit('Blik los statiegeld')).toBe(1)
    expect(packFromDeposit('Argus krat FL')).toBeNull()
    expect(packFromDeposit(null)).toBeNull()
  })
})

describe('parseLidlVolume', () => {
  test('uses the volume in the name when it carries the whole thing', () => {
    expect(parseLidlVolume('Leffe Blond 6x330ml', { name: '6-pk blik st.geld' }))
      .toEqual({ packCount: 6, unitMl: 330, totalMl: 1980 })
    expect(parseLidlVolume('Corona 6x330ml', null))
      .toEqual({ packCount: 6, unitMl: 330, totalMl: 1980 })
  })

  test('combines a name size with a deposit pack count', () => {
    // "Grolsch 0.5l" is one can; the deposit says it is sold loose
    expect(parseLidlVolume('Grolsch 0.5l', { name: 'Blik los statiegeld' }))
      .toEqual({ packCount: 1, unitMl: 500, totalMl: 500 })
  })

  test('keeps the pack count but no total when the can size is unknown', () => {
    // "Heineken pils" is a 24-pack per its deposit, but nothing says the can
    // size, so there is no honest litre price to compute -- same rule as AH's
    // "2 stuks"
    const result = parseLidlVolume('Heineken pils', { name: '24-pk blik st.geld' })
    expect(result.packCount).toBe(24)
    expect(result.totalMl).toBeNull()
  })
})
