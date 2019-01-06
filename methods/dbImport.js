const scrape = require('./scrape')
const updateCounter = require('./updateCounter')
const store = require('../models/store')
const processData = require('./processData')
const beer = require('../models/beer')

const dbImport = async () => {
  let data, stores
  data = await scrape()
  let storeQuery = store.findOne({}, { '_id': false })
  let storeExec = storeQuery.exec()
  let result = await storeExec
  if (result && result._doc) {
    stores = result._doc
  }
  let counterRaw = await updateCounter()
  let counter = counterRaw.counter
  console.log('Attemping to process data...')
  let processedData = processData(data, counter, stores)
  console.log('Succesfully processed data')
  console.log('Attemping to import data in database...')
  beer.create(processedData, function (err, beer) {
    if (err) {
      console.error(err)
    } else {
      console.log(`${processedData.length} document(s) inserted`)
    }
  })
}

module.exports = dbImport
