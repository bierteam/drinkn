// Turns a human volume string into millilitres, so a litre price computed from
// one source is comparable with one computed from another.
//
// The shapes below are the ones the two sources actually emit, sampled from a
// live AH category walk and from the biernet fixture:
//
//   AH `salesUnitSize`   "6 x 0,33 l"  "5 l"  "330 ml"  "0,5 l"  "2 stuks"
//   biernet `korte_name` "set 8x0,50"  "krat 24x0,30"
//
// Note AH's `productCount` is NOT the pack size -- '6 x 0,33 l' comes back with
// productCount 24, 27, 40, 41 and 103 on different products, so it is some
// promotion grouping. Pack size only ever comes from parsing the size string.
const UNITS = { ml: 1, cl: 10, dl: 100, l: 1000, liter: 1000, litre: 1000 }

// "0,33" and "0.33" both occur; the comma form dominates on AH
const toNumber = raw => Number(String(raw).replace(',', '.'))

const parseVolume = raw => {
  const empty = { packCount: null, unitMl: null, totalMl: null }
  if (!raw) return empty

  const text = String(raw).toLowerCase().trim()

  // `N x V unit` -- an explicit multipack. The `x` may or may not have spaces
  // around it ("6 x 0,33 l" on AH, "8x0,50" on biernet).
  const pack = text.match(/(\d+)\s*x\s*([\d.,]+)\s*(ml|cl|dl|l|liter|litre)?\b/)
  if (pack) {
    const packCount = Number(pack[1])
    // biernet writes "set 8x0,50" with the unit left off; those numbers are
    // litres, which is the only reading that makes 0,50 a sane bottle size
    const unitMl = Math.round(toNumber(pack[2]) * UNITS[pack[3] || 'l'])
    if (!packCount || !unitMl) return empty
    return { packCount, unitMl, totalMl: packCount * unitMl }
  }

  // `V unit` -- a single item
  const single = text.match(/([\d.,]+)\s*(ml|cl|dl|l|liter|litre)\b/)
  if (single) {
    const unitMl = Math.round(toNumber(single[1]) * UNITS[single[2]])
    if (!unitMl) return empty
    return { packCount: 1, unitMl, totalMl: unitMl }
  }

  // "2 stuks" and friends: a count with no volume anywhere in the string. AH
  // uses it for roughly 40% of its beer assortment and omits the unit price on
  // exactly those products, so there is genuinely nothing to compute from.
  return empty
}

// AH publishes its own litre price as prose: "normale prijs per liter €4.00".
// It is authoritative where present, so it beats anything derived from the
// size string.
const parseUnitPrice = raw => {
  if (!raw) return null
  const match = String(raw).match(/per\s+liter\s*€\s*([\d.,]+)/i)
  if (!match) return null
  const euros = toNumber(match[1])
  return Number.isFinite(euros) ? Math.round(euros * 100) : null
}

module.exports = { parseVolume, parseUnitPrice }
