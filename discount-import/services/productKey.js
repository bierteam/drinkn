// A best-effort key for recognising the same beer across sources.
//
// This is deliberately NOT used to merge records automatically. AH gives a gtin
// and biernet does not, so there is no key that is reliable in both directions;
// what this produces is a *candidate* grouping for an admin to confirm, the same
// shape of problem the store map already solves by hand in Storemapping.vue.
//
// Merging on this without review would silently collapse two different beers
// that happen to share a brand and a pack size -- a Hertog Jan pils crate and a
// Hertog Jan weizen crate are both `hertogjan|7200`.
const DIACRITICS = /[̀-ͯ]/g

// words that describe packaging or category rather than the beer itself, and
// that the two sources disagree about constantly: biernet says "krat 24x0,30",
// AH says "Hertog Jan Pilsener bier krat"
const NOISE = new Set([
  'bier', 'bieren', 'blik', 'blikje', 'blikken', 'fles', 'flesje', 'flessen',
  'krat', 'kratje', 'multipack', 'pack', 'set', 'stuks', 'pils', 'pilsener',
  'pilsner', 'premium', 'speciaalbier', 'sixpack', 'tray'
])

const normalise = value => String(value ?? '')
  .normalize('NFD')
  .replace(DIACRITICS, '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(word => word && !NOISE.has(word) && !/^\d+$/.test(word))
  .join('')

const productKey = ({ brand, title, totalMl }) => {
  // the brand alone is too coarse on AH, where every Corona variant is brand
  // "Corona"; the title alone is too noisy on biernet. Together they are
  // stable enough to propose a match.
  const name = normalise(brand) + normalise(title).replace(normalise(brand), '')
  if (!name) return null
  return totalMl ? `${name}|${totalMl}` : name
}

module.exports = { productKey, normalise }
