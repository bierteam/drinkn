if (process.env.NODE_ENV !== 'production') require('dotenv').config() // use the .env file for this
require('./setup')
const connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`

const mongoose = require('mongoose')

mongoose.connect(connectionString)
const db = mongoose.connection

const dbImport = require('./services/dbImport')
const importProducts = require('./services/importProducts')
const writeLog = require('./services/writeLog')
const context = 'Import'

db.on('error', console.error.bind(console, 'connection error:'))

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))

const run = async () => {
  // Spread the load on the sources we read: the CronJob fires on the hour, and
  // arriving exactly on it is both rude and conspicuous.
  if (process.env.SKIP_DELAY) {
    writeLog('Skipping delay as SKIP_DELAY is set.', 'Info', context)
  } else {
    const ms = Math.round(Math.random() * 60) * 1000 * 60
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
