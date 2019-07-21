const getData = require('./getData')
const store = require('../models/store')
const processData = require('./processData')
const beer = require('../models/beer')

const dbImport = async () => {
  let data, stores
  data = await getData()
  let storeQuery = store.findOne({}, { '_id': false })
  let storeExec = storeQuery.exec()
  let result = await storeExec
  if (result && result._doc) {
    stores = result._doc
  }
  console.log('Attemping to process data...')
  let processedData = await processData(data, stores)
  console.log('Succesfully processed data')
  console.log('Importing to database...')
  for (let obj of processedData) {
    let search = { id: obj.id }
    beer.find(search).exec(function (err, result) {
      if (err) console.error(err)
      if (result.length < 1) {
        beer.create(obj, function (err) {
          if (err) console.error(err)
        })
      }
    })
  }
}

module.exports = dbImport
