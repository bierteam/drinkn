const sources = require('../sources')
const product = require('../models/product')
const priceObservation = require('../models/priceObservation')
const store = require('../models/store')
const updateStores = require('./updateStores')
const writeLog = require('./writeLog')

const context = 'Import:products'

// The source-agnostic half of the import. Nothing below knows that biernet or
// AH exist -- adding a retailer is adding a file to sources/ and a line to
// sources/index.js.
const loadStoreMap = async () => {
  const result = await store.findOne({}, { _id: false }).exec()
  const raw = result?._doc ?? result?.toObject?.() ?? {}
  // the existing store document is a flat map of raw name -> canonical name,
  // maintained by hand through Storemapping.vue
  return new Map(Object.entries(raw).filter(([key]) => key !== '__v'))
}

const runSource = async (source, storeMap, newStores, now) => {
  const raw = await source.fetch()
  writeLog(`${source.name}: fetched ${raw.length} records`, 'Info', context)

  let imported = 0
  let skipped = 0
  let priceChanges = 0

  for (const item of raw) {
    const normalised = source.normalise(item)
    if (!normalised) {
      skipped += 1
      continue
    }

    // the same canonical store map the old importer applied, so "albert heijn"
    // from biernet and AH's own records collapse onto one store name
    const canonical = storeMap.get(normalised.rawStore) ?? normalised.rawStore
    normalised.store = canonical
    if (!newStores[normalised.rawStore]) newStores[normalised.rawStore] = canonical

    const key = { source: normalised.source, sourceId: normalised.sourceId }
    const existing = await product.findOne(key).exec()

    // Upsert, not insert-only. The old importer did `if (!existingBeer) create`,
    // so a record's price could never change once seen -- workable when every
    // row was a frozen offer, wrong the moment the collection holds shelf prices
    // that move.
    const saved = await product.findOneAndUpdate(
      key,
      {
        $set: { ...normalised, lastSeenAt: now },
        $setOnInsert: { firstSeenAt: now }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec()

    imported += 1

    // history is appended only when something actually moved. Writing a row per
    // product per run would add roughly 700k rows a year to record that nothing
    // happened.
    if (!existing || existing.price?.current !== normalised.price.current) {
      await priceObservation.create({
        productId: saved._id,
        source: normalised.source,
        store: canonical,
        price: normalised.price.current,
        literPrice: normalised.price.literPrice,
        isDiscounted: normalised.isDiscounted,
        seenAt: now
      })
      priceChanges += 1
    }
  }

  return { imported, skipped, priceChanges }
}

const importProducts = async (now = new Date()) => {
  const storeMap = await loadStoreMap()
  const newStores = {}
  const summary = []

  for (const source of sources) {
    if (!source.enabled()) {
      writeLog(`${source.name}: disabled, skipping`, 'Info', context)
      continue
    }

    try {
      const result = await runSource(source, storeMap, newStores, now)
      writeLog(
        `${source.name}: imported ${result.imported}, skipped ${result.skipped}, price changes ${result.priceChanges}`,
        'Info',
        context
      )
      summary.push({ source: source.name, ...result })
    } catch (error) {
      // one source failing must not cost the others their run. getData() throws
      // on any endpoint error, so before this a single biernet hiccup aborted
      // the entire import.
      writeLog(`${source.name}: failed, continuing with other sources -- ${error.message}`, 'Error', context)
      summary.push({ source: source.name, error: error.message })
    }
  }

  if (Object.keys(newStores).length) updateStores(newStores)
  return summary
}

module.exports = importProducts
