const getData = require('./getData')
const store = require('../models/store')
const processData = require('./processData')
const beer = require('../models/beer')
const writeLog = require('./writeLog')
const context = 'Import'
const mongoose = require('mongoose')

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const dbImport = async () => {
  try {
    const ms = Math.round(Math.random() * 60) * 1000 * 60
    writeLog(`Cron: running import in: ${ms / 60000} minutes.`, 'Info', context)
    await timeout(ms)

    let stores
    const data = await getData()
    const result = await store.findOne({}, { _id: false }).exec()
    if (result?.result?._doc) {
      stores = result._doc
    }

    writeLog('Attempting to process data...', 'Info', context)
    const processedData = await processData(data, stores)
    writeLog('Successfully processed data', 'Info', context)

    writeLog('Importing to the database...', 'Info', context)
    for (const obj of processedData) {
      const search = { id: obj.id }
      const existingBeer = await beer.findOne(search).exec()
      if (!existingBeer) {
        await beer.create(obj)
      }
    }

    await timeout(10000)
    mongoose.connection.close()
  } catch (err) {
    writeLog(err, 'Error', context)
  }
}

module.exports = dbImport
