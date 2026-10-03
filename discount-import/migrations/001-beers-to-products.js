// Backfill `beers` into `products`.
//
// Design constraints, in the order they mattered:
//
//  1. It never writes to `beers`. The legacy collection, the /discounts
//     endpoint and Discounts.vue keep working throughout, and rolling back is
//     `db.products.drop()` with nothing else to undo.
//  2. It is idempotent. Every write is an upsert keyed on {source, sourceId},
//     so a half-finished run is fixed by running it again -- which matters
//     because it is the kind of thing that gets interrupted.
//  3. It repairs on the way through rather than copying faithfully. The old
//     rows carry float cents (`927.9999999999999`) and a litre price in euros
//     while the neighbouring prices are in cents; copying that across would
//     move the inconsistency into the schema meant to fix it.
//
// Usage:
//   node migrations/001-beers-to-products.js --dry-run
//   node migrations/001-beers-to-products.js
const mongoose = require('mongoose')
const beer = require('../models/beer')
const product = require('../models/product')
const { parseVolume } = require('../services/units')
const { productKey } = require('../services/productKey')
const { centsPerLitre } = require('../services/money')

const BATCH = 500

// `beers` rows are all biernet offers -- it is the only source that ever wrote
// to that collection.
const convert = doc => {
  const parsed = parseVolume(doc.volume)
  const totalMl = doc.liter || parsed.totalMl

  // the old importer multiplied a price string by 100 and stored the float
  const current = Math.round(doc.pricing?.newPrice ?? 0)
  const base = doc.pricing?.rawOldPrice !== undefined ? Math.round(doc.pricing.oldPrice) : null

  return {
    source: 'biernet',
    // the old `id` was md5(biernet uid) truncated to 10 hex chars. The uid it
    // was derived from is not stored anywhere on the row, so the hash is the
    // only identifier these rows have and it becomes the sourceId. New biernet
    // imports key on the raw uid, so a migrated row and a freshly imported one
    // are two rows until the offer expires -- acceptable, because these are
    // historic offers, and the alternative is inventing a uid we do not have.
    sourceId: doc.id,
    productKey: productKey({ brand: doc.brand, title: '', totalMl }),
    brand: doc.brand,
    title: doc.brand,
    store: doc.store,
    rawStore: doc.rawStore ?? doc.store,
    volume: doc.volume,
    packCount: parsed.packCount,
    unitMl: parsed.unitMl,
    totalMl: totalMl || null,
    // stored as 540 for a 5.4% beer, and divided by 100 again in the view
    alcoholPercentage: typeof doc.alcoholPercentage === 'number' ? doc.alcoholPercentage / 100 : undefined,
    color: doc.color || undefined,
    uri: doc.uri || undefined,
    price: {
      current,
      base,
      // recomputed rather than carried over: the old literPrice is in euros as
      // a float, next to prices in cents
      literPrice: centsPerLitre(current, totalMl)
    },
    isDiscounted: true,
    discount: {
      mechanism: 'korting',
      endsAt: doc.validity ?? null
    },
    firstSeenAt: doc.importDate ?? new Date(),
    lastSeenAt: doc.importDate ?? new Date()
  }
}

const migrate = async ({ dryRun = false } = {}) => {
  const total = await beer.countDocuments().exec()
  let processed = 0
  let written = 0
  let skipped = 0

  const cursor = beer.find({}).lean().cursor()
  let operations = []

  const flush = async () => {
    if (!operations.length || dryRun) {
      operations = []
      return
    }
    const result = await product.bulkWrite(operations, { ordered: false })
    written += (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0)
    operations = []
  }

  for await (const doc of cursor) {
    processed += 1
    const converted = convert(doc)

    // a row with no usable price is not worth carrying forward
    if (!converted.price.current || !converted.brand || !converted.store) {
      skipped += 1
      continue
    }

    operations.push({
      updateOne: {
        filter: { source: converted.source, sourceId: converted.sourceId },
        update: { $set: converted },
        upsert: true
      }
    })

    if (operations.length >= BATCH) await flush()
    if (processed % 2000 === 0) console.log(`  ${processed}/${total}...`)
  }

  await flush()

  const duplicates = await findDuplicates()
  return { total, processed, written, skipped, duplicates, dryRun }
}

// Mongoose builds the {source, sourceId} unique index in the background and
// swallows the error when it cannot. Found the hard way: a seed containing
// three duplicate rows left the collection with no unique index at all, and
// nothing said so -- the upsert key the whole import pipeline depends on was
// silently unprotected.
const findDuplicates = async () => {
  const clashes = await product.aggregate([
    { $group: { _id: { source: '$source', sourceId: '$sourceId' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 }
  ]).exec()
  return clashes.map(c => `${c._id.source}/${c._id.sourceId} x${c.count}`)
}

module.exports = { migrate, convert, findDuplicates }

if (require.main === module) {
  if (process.env.NODE_ENV !== 'production') require('dotenv').config()
  const dryRun = process.argv.includes('--dry-run')
  const connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`

  mongoose.connect(connectionString)
    .then(() => migrate({ dryRun }))
    .then(async summary => {
      console.log(dryRun ? 'Dry run complete (nothing written):' : 'Migration complete:')
      console.log(`  read    ${summary.processed} of ${summary.total}`)
      console.log(`  written ${summary.written}`)
      console.log(`  skipped ${summary.skipped}`)
      if (summary.duplicates.length) {
        console.error('')
        console.error('REFUSING TO CALL THIS DONE: duplicate {source, sourceId} rows remain,')
        console.error('so the unique index cannot build and mongoose will not say so:')
        summary.duplicates.forEach(d => console.error(`  ${d}`))
        process.exitCode = 1
      }
      await mongoose.connection.close()
    })
    .catch(async error => {
      console.error('Migration failed:', error)
      await mongoose.connection.close()
      process.exitCode = 1
    })
}
