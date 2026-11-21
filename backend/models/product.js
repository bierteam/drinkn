const mongoose = require('mongoose')

// What `beer` could not express.
//
// The `beer` document is a discount observation: it requires an old price, a new
// price and a validity date, so a beer sitting at its normal shelf price has no
// representation at all. That is the single reason "show me all beers" could not
// be built on it, independent of where the data comes from.
//
// Here the product and the offer are separate. Everything about the beer itself
// is always present; `discount` is the part that may be absent.
const productSchema = new mongoose.Schema({
  // Identity ---------------------------------------------------------------
  // the natural key from the source it came from. `id` on `beer` was
  // md5(biernet uid) truncated to 10 hex characters -- a biernet primary key
  // wearing a hash, with no room for a second source and only 40 bits of space.
  source: { type: String, required: true },
  sourceId: { type: String, required: true },

  // the real cross-source key, where a source publishes one. AH does, on its
  // product detail endpoint; biernet does not, so this stays sparse.
  gtin: { type: String, required: false },

  // a normalised brand+size string, for *proposing* matches between sources.
  // Never used to merge automatically -- see services/productKey.js
  productKey: { type: String, required: false },

  // Product ----------------------------------------------------------------
  brand: { type: String, required: true },
  title: { type: String, required: false },
  store: { type: String, required: true },
  rawStore: { type: String, required: false },

  volume: { type: String, required: false },
  packCount: { type: Number, required: false },
  unitMl: { type: Number, required: false },
  // null for the ~40% of AH's assortment sold as "2 stuks", where no volume is
  // published anywhere in the search payload. Those are excluded from litre
  // sorting rather than guessed at.
  totalMl: { type: Number, required: false },

  alcoholPercentage: { type: Number, required: false },
  color: { type: String, required: false },
  image: { type: String, required: false },
  uri: { type: String, required: false },

  // Offer ------------------------------------------------------------------
  // every amount is an integer number of cents, litre price included. See
  // services/money.js for why that is worth being strict about.
  price: {
    current: { type: Number, required: true },
    base: { type: Number, required: false },
    literPrice: { type: Number, required: false }
  },

  isDiscounted: { type: Boolean, required: true, default: false },
  discount: {
    mechanism: { type: String, required: false },
    startsAt: { type: Date, required: false },
    endsAt: { type: Date, required: false }
  },

  // Observation ------------------------------------------------------------
  firstSeenAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true }
}, { autoIndex: true })

// one row per product per source; the upsert in importProducts keys on this
productSchema.index({ source: 1, sourceId: 1 }, { unique: true })
// the read path filters on these, and `beer` indexed none of the fields it
// actually queried -- validity included
productSchema.index({ isDiscounted: 1, 'discount.endsAt': 1 })
productSchema.index({ store: 1 })
productSchema.index({ productKey: 1 })
// backs the free-text search box without shipping the whole collection
productSchema.index({ brand: 'text', title: 'text' })

const product = mongoose.model('product', productSchema)
module.exports = product
