const axios = require('axios')
const writeLog = require('../services/writeLog')
const { toCents, centsPerLitre } = require('../services/money')
const { parseVolume, parseUnitPrice } = require('../services/units')
const { productKey } = require('../services/productKey')

const context = 'Import:ah'

// Albert Heijn's own app API. Two things about it that cost time to discover:
//
//  * the application header is `X-Application`, not `Application`. The latter
//    returns a 500 with "Can not find application: 'null'", which reads like an
//    outage rather than a bad request.
//  * the anonymous token lasts a week (expires_in 604798), so re-authenticating
//    every run is pure noise against their auth service. It is cached below for
//    the life of the process, which for a CronJob is one run.
const BASE = 'https://api.ah.nl'
const HEADERS = {
  'User-Agent': 'Appie/8.22.3',
  'X-Application': 'AHWEBSHOP',
  Accept: 'application/json'
}

// the beer taxonomy, rather than a `query=bier` text search: a category walk is
// stable, does not depend on relevance ranking, and does not sweep in whatever
// else happens to mention beer.
const TAXONOMY = [
  { id: 2137, name: 'Bier pils' },
  { id: 2139, name: 'Speciaalbier' },
  { id: 18399, name: 'Alcoholvrij bier' },
  { id: 18403, name: 'Radler, Mexicaans, cider, fruitbier' },
  { id: 20752, name: 'Glutenvrij bier' }
]

const PAGE_SIZE = 100
// they are a supermarket, not a public data provider. One request every 400ms
// walks the whole assortment in well under a minute and stays unremarkable.
const REQUEST_DELAY_MS = 400
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))

let cachedToken = null

const authenticate = async () => {
  if (cachedToken) return cachedToken
  const response = await axios.post(
    `${BASE}/mobile-auth/v1/auth/token/anonymous`,
    { clientId: 'appie' },
    { headers: { ...HEADERS, 'Content-Type': 'application/json' }, timeout: 15000 }
  )
  cachedToken = response.data.access_token
  return cachedToken
}

const fetchPage = async (token, taxonomyId, page) => {
  const response = await axios.get(`${BASE}/mobile-services/product/search/v2`, {
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    params: { taxonomyId, size: PAGE_SIZE, page },
    timeout: 20000
  })
  return response.data
}

const fetch = async () => {
  const token = await authenticate()
  const products = []
  const seen = new Set()

  for (const category of TAXONOMY) {
    let page = 0
    let totalPages = 1

    while (page < totalPages) {
      const data = await fetchPage(token, category.id, page)
      totalPages = data.page?.totalPages ?? 0

      for (const item of data.products ?? []) {
        // a beer can sit in two taxonomy nodes; webshopId is the natural key
        if (seen.has(item.webshopId)) continue
        seen.add(item.webshopId)
        products.push(item)
      }

      page += 1
      if (page < totalPages) await timeout(REQUEST_DELAY_MS)
    }

    writeLog(`${category.name}: ${products.length} products so far`, 'Info', context)
  }

  return products
}

const normalise = raw => {
  const volume = parseVolume(raw.salesUnitSize)

  // AH splits the price across two fields and which one holds the shelf price
  // depends on whether the product is on offer. Sampled over 400 products:
  // `priceBeforeBonus` is present on every single one, `currentPrice` only when
  // a genuinely lower price applies. Reading `currentPrice` alone silently drops
  // every non-discounted beer -- 135 of those 400.
  const current = toCents(raw.currentPrice) ?? toCents(raw.priceBeforeBonus)
  if (current === null) return null

  // 6 of 400 are flagged isBonus with no lower price: multi-buy mechanics like
  // "2e halve prijs", where the shelf price per item is unchanged. Those get no
  // strikethrough, because there is nothing to strike through.
  const discounted = toCents(raw.currentPrice) !== null && Boolean(raw.isBonus)

  // AH publishes its own litre price and it is authoritative; deriving one from
  // the size string is the fallback. Note their prose price is the *normal*
  // litre price on a discounted product ("normale prijs per liter"), so it is
  // only trusted when the product is not on offer.
  const published = parseUnitPrice(raw.unitPriceDescription)
  const derived = centsPerLitre(current, volume.totalMl)
  const literPrice = discounted ? (derived ?? null) : (published ?? derived ?? null)

  const base = discounted ? toCents(raw.priceBeforeBonus) : null

  return {
    source: 'ah',
    sourceId: String(raw.webshopId),
    productKey: productKey({ brand: raw.brand, title: raw.title, totalMl: volume.totalMl }),
    brand: raw.brand || raw.title,
    title: raw.title,
    // the canonical name, so it lands on the same store as biernet's
    // "albert heijn" once the existing store map is applied
    rawStore: 'albert heijn',
    volume: raw.salesUnitSize,
    packCount: volume.packCount,
    unitMl: volume.unitMl,
    totalMl: volume.totalMl,
    image: raw.images?.[0]?.url,
    uri: `https://www.ah.nl/producten/product/wi${raw.webshopId}`,
    price: { current, base: base ?? null, literPrice },
    isDiscounted: discounted,
    discount: discounted
      ? {
          mechanism: raw.bonusMechanism || raw.bonusSegmentDescription,
          startsAt: raw.bonusStartDate ? new Date(raw.bonusStartDate) : null,
          endsAt: raw.bonusEndDate ? new Date(raw.bonusEndDate) : null
        }
      : {}
  }
}

module.exports = {
  name: 'ah',
  // a source is a liability as much as an asset: this lets one be switched off
  // without a deploy if it starts returning nonsense or objecting to being read
  enabled: () => process.env.SOURCE_AH !== 'false',
  fetch,
  normalise,
  // exported for the tests, which should not have to reach into a live API
  TAXONOMY
}
