const getData = require('./getData')
const store = require('../models/store')
const processData = require('./processData')
const beer = require('../models/beer')
const writeLog = require('./writeLog')
const context = 'Import'
const mongoose = require('mongoose')

const timeout = ms => new Promise((resolve) => setTimeout(resolve, ms))

const dbImport = async () => {
  const ms = Math.round(Math.random() * 60) * 1000 * 60
  writeLog('Cron: running import in: ' + (ms / 60000) + ' minutes.', 'Info', context)
  await timeout(ms)
  let stores
  const data = await getData()
  const result = await store.findOne({}, { _id: false }).exec()
  if (result && result._doc) {
    stores = result._doc
  }
  writeLog('Attemping to process data...', 'Info', context)
  const processedData = await processData(data, stores)
  writeLog('Succesfully processed data', 'Info', context)
  writeLog('Importing to database...', 'Info', context)
  for (const obj of processedData) {
    const search = { id: obj.id }
    beer.find(search).exec(function (err, result) {
      if (err) writeLog(err, 'Error', context)
      if (result.length < 1) {
        beer.create(obj, function (err) {
          if (err) writeLog(err, 'Error', context)
        })
      }
    })
  }
  await timeout(10000)
  mongoose.connection.close()
}

module.exports = dbImport
