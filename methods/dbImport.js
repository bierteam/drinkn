const scrape = require('./scrape')
const updateCounter = require('./updateCounter')
const store = require('../models/store')
const processData = require('./processData')
const beer = require('../models/beer')

const dbImport = () => {
  let data, stores
  scrape()
    .then(output => {
      data = output
      let storeQuery = store.findOne({})
      let storeExec = storeQuery.exec()
      storeExec.then(function (result) {
        stores = result
      })
    })
    .then(output => {
      return updateCounter()
    })
    .then(result => {
      const counter = result.counter
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
    }).catch(function (error) {
      console.error(error)
    })
}

module.exports = dbImport
