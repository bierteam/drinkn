const getData = require('../services/getData')
const uriPrettifier = require('../services/uriPrettifier')
const { toCents, centsPerLitre } = require('../services/money')
const { parseVolume } = require('../services/units')
const { productKey } = require('../services/productKey')
const parseDutchDate = require('../services/parseDutchDate')

// biernet, expressed as a source adapter. The fetching is the existing
// services/getData.js untouched -- only the mapping moves here, so that the
// biernet-specific Dutch field names (`winkel_name`, `vanprijs`, `korte_name`)
// stop being hardcoded into a pipeline that now has to serve two sources.
//
// Worth stating plainly: biernet only ever publishes *offers*. There is no
// such thing as a biernet record for a beer at its normal price, so every
// record from here is `isDiscounted: true`. Full assortment coverage can only
// come from a retailer source like AH.
const normalise = raw => {
  const current = toCents(raw.voorprijs)
  const base = toCents(raw.vanprijs)
  if (current === null || !raw.merken_name || !raw.winkel_name) return null

  // biernet publishes the pack volume as a number of litres, which is more
  // reliable than parsing `korte_name` -- but fall back to the parser when it
  // is missing, so the two sources agree on what a litre price means
  const parsed = parseVolume(raw.korte_name)
  const totalMl = raw.aantal_liter ? Math.round(Number(raw.aantal_liter) * 1000) : parsed.totalMl

  // add a day: biernet's einddatum is the last day the offer is valid, and the
  // read path wants the moment it stops being valid
  const parsedEnd = parseDutchDate(raw.einddatum)
  const endsAt = parsedEnd ? new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000) : null

  return {
    source: 'biernet',
    sourceId: String(raw.uid),
    productKey: productKey({ brand: raw.merken_name, title: '', totalMl }),
    brand: raw.merken_name,
    title: raw.merken_name,
    rawStore: raw.winkel_name,
    volume: raw.korte_name,
    packCount: parsed.packCount,
    unitMl: parsed.unitMl,
    totalMl,
    // biernet reports 5.4 for a 5.4% beer; the old importer stored 540 and the
    // view divided by 100 again on the way out. Kept as the honest percentage.
    alcoholPercentage: raw.alcoholpercentage ? Number(Number.parseFloat(raw.alcoholpercentage).toFixed(2)) : undefined,
    color: raw.kleur || undefined,
    uri: raw.aanbieding_link ? uriPrettifier(raw.aanbieding_link) : undefined,
    price: { current, base: base ?? null, literPrice: centsPerLitre(current, totalMl) },
    isDiscounted: true,
    discount: { mechanism: base ? 'korting' : undefined, endsAt }
  }
}

module.exports = {
  name: 'biernet',
  enabled: () => process.env.SOURCE_BIERNET !== 'false',
  fetch: getData,
  normalise
}
