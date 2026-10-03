const getData = require('./getData')
const store = require('../models/store')
const processData = require('./processData')
const beer = require('../models/beer')
const writeLog = require('./writeLog')
const context = 'Import'

// The startup jitter and the connection close moved to server.js: two
// pipelines now share one process, so neither can own the delay before all work
// starts or the teardown after all work ends.
const dbImport = async () => {
  try {
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
  } catch (err) {
    writeLog(err, 'Error', context)
  }
}

module.exports = dbImport
