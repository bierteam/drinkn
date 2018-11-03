const scrape = require('./scrape')
const processData = require('./processData')
const beer = require('../models/beer')

const dbImport = () => {
  scrape().then((array) => {
    let processedData = processData(array.data)
    for (let obj in processedData) {
      beer.create(processedData[obj], function (err, beer) {
        if (err) {
          console.log(err)
        }
      })
    }
    console.log(`${processedData.length} document(s) inserted`)
  }
  )
}

module.exports = dbImport
