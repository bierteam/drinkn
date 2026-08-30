// One store's base prices from the Lidl Plus self-scan master.
//
// This is deliberately NOT a source in sources/index.js and NOT wired into the
// CronJob. The self-scan endpoint is authenticated with a *personal* Lidl Plus
// account, and putting personal credentials in the cluster to run unattended is
// exactly the standing, attributable access the endpoint is gated against. So
// this is a thing you run by hand, from your own machine, when you feel like it
// -- "the base prices of my own Lidl, once a month".
//
// It writes into the same `products` collection through the same
// {source, sourceId} upsert as every other source, tagged source:'lidl-selfscan'
// and isDiscounted:false, so the rows show up as base prices in "All beers"
// alongside AH.
//
// Usage:
//   node scripts/lidl-selfscan.js --file lidl.json            # dry run, prints
//   node scripts/lidl-selfscan.js --file lidl.json --write    # upsert to mongo
//   LIDL_TOKEN=... node scripts/lidl-selfscan.js --store NL0405 --write
//
// The token is read from the LIDL_TOKEN env var and never from an argument, so
// it does not end up in your shell history. It is your credential: keep it out
// of the repo (lidl.json and .lidl.env are gitignored).
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config()
  } catch {
    /* optional in this standalone script */
  }
}

const fs = require('node:fs')
const axios = require('axios')
const { parseLidlVolume } = require('./lidlVolume')
const { centsPerLitre } = require('../services/money')

const COUNTRY = process.env.LIDL_COUNTRY || 'NL'
const args = process.argv.slice(2)
const opt = name => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const has = name => args.includes(name)

const filePath = opt('--file')
// a Lidl store id is an alphanumeric code like "NL0405". Constrain it to that at
// the source: it is both logged and interpolated into the request path, and
// leaving it as free argv/env text invites log forging and path traversal
const rawStoreId = opt('--store') || process.env.LIDL_STORE
const storeId = rawStoreId ? rawStoreId.replace(/[^A-Za-z0-9]/g, '') : undefined
const write = has('--write')

// A row is beer if it is age-18 restricted *and* its name reads like beer. The
// age flag alone also catches wine and spirits; the name alone catches things
// like "Hertog ijs" (ice cream). Both together is a decent filter for a master
// with no category field.
const BEER = /\b(pils|bier|radler|weizen|bok|ipa|tripel|blond|witbier|speciaal|lager|stout|ale|bock)\b|heineken|grolsch|hertog jan|amstel|bavaria|jupiler|desperados|corona|kordaat|perlenbacher|gerardus|leffe|paulaner|tsingtao|warsteiner|affligem|hoegaarden|duvel|brand /i

const isBeer = p => p.restrictions?.age === 18 && BEER.test(p.name || '')

// One id appears as several rows -- one per barcode variant -- and the fields
// are scattered across them: the real EAN is on one row, the deposit and age
// restriction on another. Collapse each id to a single record that has picked
// up the EAN and kept any deposit/restriction seen on any of its rows.
const mergeById = rows => {
  const byId = new Map()
  for (const row of rows) {
    const merged = byId.get(row.id) || { ...row }
    if (/^\d{12,14}$/.test(row.barcode || '')) merged.gtin = row.barcode
    merged.deposit = merged.deposit || row.deposit
    merged.restrictions = merged.restrictions || row.restrictions
    byId.set(row.id, merged)
  }
  return [...byId.values()]
}

const ALCOHOL = /(\d+(?:[.,]\d+)?)\s*%/

const normalise = (raw, store) => {
  // euros, mixed int/float in the source. Everything downstream is integer cents.
  const price = typeof raw.unitPrice === 'number' ? raw.unitPrice : Number(raw.unitPrice)
  if (!Number.isFinite(price) || price < 0.10) return null // 0.01 placeholders

  const current = Math.round(price * 100)
  const volume = parseLidlVolume(raw.name, raw.deposit)
  const alc = ALCOHOL.exec(String(raw.name))

  return {
    source: 'lidl-selfscan',
    sourceId: String(raw.id),
    // the EAN is picked in mergeById below; the short internal barcode is not a
    // real barcode
    gtin: /^\d{12,14}$/.test(raw.gtin || '') ? raw.gtin : undefined,
    brand: raw.name,
    title: raw.name,
    rawStore: `Lidl ${store}`,
    store: `Lidl ${store}`,
    volume: raw.name,
    packCount: volume.packCount,
    unitMl: volume.unitMl,
    totalMl: volume.totalMl,
    alcoholPercentage: alc ? Number(alc[1].replace(',', '.')) : undefined,
    // NB: the source also carries statiegeld (deposit.unitPrice) -- a figure
    // neither biernet nor AH expose -- but the `product` schema has no field for
    // it, so it is dropped here rather than emitted and silently stripped on
    // save. Worth a schema field if statiegeld ever earns its place in the UI.
    price: { current, base: null, literPrice: centsPerLitre(current, volume.totalMl) },
    isDiscounted: false,
    discount: {}
  }
}

const load = async () => {
  if (filePath) return JSON.parse(fs.readFileSync(filePath, 'utf8')).products
  if (!storeId) throw new Error('need --store <id> (or LIDL_STORE) when not using --file')
  const token = process.env.LIDL_TOKEN
  if (!token) throw new Error('LIDL_TOKEN is not set')
  const url = `https://selfscanning.lidlplus.com/api/v1/${COUNTRY}/stores/${storeId}/masterdata`
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'okhttp/4.12.0' },
    timeout: 30000
  })
  return res.data.products
}

const run = async () => {
  const store = storeId || 'unknown'
  const raw = await load()

  const beers = []
  for (const item of mergeById(raw)) {
    if (!isBeer(item)) continue
    const n = normalise(item, store)
    if (n) beers.push(n)
  }

  const withLitre = beers.filter(b => b.price.literPrice != null).length
  // only counts go to the console -- no product name, which is fetched data and
  // has no business in a log line
  console.log(`Lidl ${storeId}: ${raw.length} master rows -> ${beers.length} beer products (${withLitre} with a litre price)`)

  if (!write) {
    // the names and prices go to a file you can open, rather than a truncated
    // console preview: a dry run should let you inspect everything it would
    // write, and a file is not a log-injection sink the way a console line is
    const out = 'lidl-selfscan-preview.json'
    fs.writeFileSync(out, JSON.stringify(beers, null, 2))
    console.log(`\nDry run. Wrote ${beers.length} products to ${out} for inspection.`)
    console.log('Re-run with --write to upsert them into the products collection.')
    return
  }

  // connect and upsert only when actually writing, so a dry run needs no DB
  require('../setup')
  const mongoose = require('mongoose')
  const product = require('../models/product')
  const priceObservation = require('../models/priceObservation')
  // NO_SRV switches to a plain mongodb:// string with a port, and empty
  // credentials drop the auth segment -- both the way the backend does it, so
  // this can be pointed at a local mongo for a trial run
  const protocol = process.env.NO_SRV ? 'mongodb' : 'mongodb+srv'
  const auth = process.env.DB_USERNAME ? `${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@` : ''
  await mongoose.connect(`${protocol}://${auth}${process.env.DB_HOST}/${process.env.DB_NAME}`)

  const now = new Date()
  let upserted = 0
  for (const b of beers) {
    const key = { source: b.source, sourceId: b.sourceId }
    const existing = await product.findOne(key).exec()
    const saved = await product.findOneAndUpdate(
      key,
      { $set: { ...b, lastSeenAt: now }, $setOnInsert: { firstSeenAt: now } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec()
    if (!existing || existing.price?.current !== b.price.current) {
      await priceObservation.create({
        productId: saved._id, source: b.source, store: b.store,
        price: b.price.current, literPrice: b.price.literPrice, isDiscounted: false, seenAt: now
      })
    }
    upserted += 1
  }
  console.log(`\nUpserted ${upserted} products into the database.`)
  await mongoose.connection.close()
}

run().catch(err => {
  console.error(err.message)
  process.exitCode = 1
})
