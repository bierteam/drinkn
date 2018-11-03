const scrape = require('./scrape')
const processData = require('./processData')
const beer = require('../models/beer')

const dbImport = () => {
  scrape().then((array) => {
    let processedData = processData(array.data)
    beer.create(processedData, function (err, beer) {
      if (err) {
        console.error(err)
      }
    })
    console.log(`${processedData.length} document(s) inserted`)
  }
  )
}

module.exports = dbImport
