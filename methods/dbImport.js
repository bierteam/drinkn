const getData = require('./getData')
const store = require('../models/store')
const processData = require('./processData')
const beer = require('../models/beer')
const writeLog = require('./writeLog')
const context = 'Import'

const dbImport = async () => {
  let data, stores
  data = await getData()
  let storeQuery = store.findOne({}, { '_id': false })
  let storeExec = storeQuery.exec()
  let result = await storeExec
  if (result && result._doc) {
    stores = result._doc
  }
  writeLog('Attemping to process data...', 'Info', context)
  let processedData = await processData(data, stores)
  writeLog('Succesfully processed data', 'Info', context)
  writeLog('Importing to database...', 'Info', context)
  for (let obj of processedData) {
    let search = { id: obj.id }
    beer.find(search).exec(function (err, result) {
      if (err) writeLog(err, 'Error', context)
      if (result.length < 1) {
        beer.create(obj, function (err) {
          if (err) writeLog(err, 'Error', context)
        })
      }
    })
  }
}

module.exports = dbImport
