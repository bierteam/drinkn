const { parseVolume } = require('../services/units')

// Lidl's self-scan store master has no volume field of its own. The pack size
// hides in deposit.name ("24-pk blik st.geld", "6-pk blik st.geld", "Blik los")
// and a bottle/can size sometimes appears in the product name ("6x330ml",
// "0,5l"). Neither is reliable on its own, so this combines them.
const packFromDeposit = depositName => {
  if (!depositName) return null
  // [\s-]* rather than \s*-?\s*: the two adjacent optional-space groups around
  // an optional dash are what makes the match backtrack
  const pk = /(\d+)[\s-]*pk/i.exec(depositName)
  if (pk) return Number(pk[1])
  if (/\blos\b|losse/i.test(depositName)) return 1
  return null
}

const parseLidlVolume = (name, deposit) => {
  // the name may already carry the whole thing, e.g. "6x330ml"
  const fromName = parseVolume(name)
  if (fromName.totalMl) return fromName

  // otherwise take a single-unit size from the name and a pack count from the
  // deposit label
  const pack = packFromDeposit(deposit?.name)
  const single = parseVolume(name.replace(/\d+ ?x/i, ''))
  if (pack && single.unitMl) {
    return { packCount: pack, unitMl: single.unitMl, totalMl: pack * single.unitMl }
  }
  return { packCount: pack, unitMl: single.unitMl || null, totalMl: null }
}

module.exports = { parseLidlVolume, packFromDeposit }
