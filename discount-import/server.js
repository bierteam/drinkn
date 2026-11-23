if (process.env.NODE_ENV !== 'production') require('dotenv').config() // use the .env file for this
require('./setup')
const connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`

const mongoose = require('mongoose')
const { randomInt } = require('node:crypto')

mongoose.connect(connectionString)
const db = mongoose.connection

const dbImport = require('./services/dbImport')
const importProducts = require('./services/importProducts')
const writeLog = require('./services/writeLog')
const context = 'Import'

db.on('error', console.error.bind(console, 'connection error:'))

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))

const run = async () => {
  // The CronJob fires on the hour; this moves the actual request time somewhere
  // inside the following hour and puts it somewhere different every day. Two
  // reasons, and the second is the load-bearing one: arriving exactly on the
  // hour concentrates load on the sources, and arriving at the *same* time
  // every day is a pattern in someone else's access log. Keep the randomness
  // even if the schedule changes -- a fixed minute is a better fingerprint than
  // a round one.
  if (process.env.SKIP_DELAY) {
    writeLog('Skipping delay as SKIP_DELAY is set.', 'Info', context)
  } else {
    // randomInt rather than Math.random: nothing here is security-sensitive,
    // it is only scheduling jitter, but a CSPRNG costs nothing once a run and
    // saves the reader deciding whether it mattered
    const ms = randomInt(0, 61) * 1000 * 60
    writeLog(`Cron: running import in: ${ms / 60000} minutes.`, 'Info', context)
    await timeout(ms)
  }

  // The legacy pipeline, still filling `beers` so the existing /discounts
  // endpoint and Discounts.vue keep working untouched while the new collection
  // is proven. It fetches biernet a second time, which is the one wart of
  // running both -- it goes away with the legacy path itself.
  if (process.env.LEGACY_IMPORT !== 'false') {
    await dbImport()
  }

  await importProducts()

  await timeout(10000)
  await mongoose.connection.close()
}

run().catch(async error => {
  writeLog(error, 'Error', context)
  await mongoose.connection.close()
  process.exitCode = 1
})
