const product = require('../models/product')

// In a preview namespace the database is seeded from a fixture of long-expired
// offers, so filtering them out leaves an empty page. Same reasoning as
// services/discount.js.
const pr = process.env.PR || false

const SORTABLE = {
  literPrice: 'price.literPrice',
  price: 'price.current',
  brand: 'brand',
  store: 'store',
  endsAt: 'discount.endsAt'
}

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 60

// Everything below arrives from the query string, so it is coerced to a
// primitive before it goes anywhere near a filter.
//
// Express 5 defaults its query parser to 'simple', which returns undefined for
// `?store[$ne]=x` rather than a nested object -- so operator injection is not
// possible as the app stands today. That is a framework default that already
// changed once between Express 4 and 5 though, and one `app.set('query parser',
// 'extended')` anywhere would turn every one of these into a Mongo operator the
// caller controls. Not worth leaving to a default.
const asString = value => (typeof value === 'string' ? value : undefined)

const clampInt = (value, fallback, min, max) => {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number)) return fallback
  return Math.min(Math.max(number, min), max)
}

const buildFilter = ({ search, store, onlyDiscounted, alcoholic }) => {
  const filter = {}

  const storeName = asString(store)
  if (storeName) filter.store = storeName

  if (onlyDiscounted) {
    filter.isDiscounted = true
    // an offer that has ended is not an offer. The old read path filtered on a
    // date computed once at module load, so anything that expired while the
    // process was up was still served.
    if (!pr) {
      filter.$or = [
        { 'discount.endsAt': { $gte: new Date() } },
        { 'discount.endsAt': null }
      ]
    }
  }

  if (alcoholic === false) filter.alcoholPercentage = { $lt: 0.5 }
  if (alcoholic === true) filter.alcoholPercentage = { $gte: 0.5 }

  const term = asString(search)
  if (term) {
    // escaped: the value comes straight off the query string, and an unescaped
    // regex there is both a correctness bug and a cheap way to pin the CPU
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    filter.$and = [{ $or: [{ brand: pattern }, { title: pattern }, { volume: pattern }] }]
  }

  return filter
}

// Server-side, unlike /discounts, which returns every matching row and leaves
// the filtering to the browser. That works at a few hundred discounts; the AH
// assortment alone is roughly 900 products before any other retailer, and the
// whole collection would be shipped and re-sorted on every page load.
const products = async (query = {}) => {
  const onlyDiscounted = query.onlyDiscounted === 'true'
  const alcoholic = query.alcoholic === undefined ? undefined : query.alcoholic === 'true'
  // a sort field is only ever one of the keys of SORTABLE, never the caller's
  // string, so the sort document cannot be shaped from the query either

  const filter = buildFilter({ search: query.search, store: query.store, onlyDiscounted, alcoholic })

  const page = clampInt(query.page, 0, 0, 10000)
  const limit = clampInt(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
  const direction = query.dir === 'desc' ? -1 : 1
  const sortField = SORTABLE[asString(query.sort)] ?? SORTABLE.literPrice

  // products with no published volume have no litre price, and null sorts
  // before every number in Mongo. They would otherwise fill the first page of
  // the default sort with rows that have nothing to show in that column.
  const sortFilter = sortField === 'price.literPrice'
    ? { ...filter, 'price.literPrice': { $ne: null } }
    : filter

  const [items, total] = await Promise.all([
    product.find(sortFilter)
      .sort({ [sortField]: direction, _id: 1 })
      .skip(page * limit)
      .limit(limit)
      .lean()
      .exec(),
    product.countDocuments(sortFilter).exec()
  ])

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

// the filter dropdown needs every store, not just the ones on the current page
const facets = async () => {
  const [stores, total, discounted] = await Promise.all([
    product.distinct('store').exec(),
    product.estimatedDocumentCount().exec(),
    product.countDocuments({ isDiscounted: true }).exec()
  ])
  return {
    stores: stores.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'nl')),
    total,
    discounted
  }
}

module.exports = { products, facets, buildFilter, SORTABLE }
