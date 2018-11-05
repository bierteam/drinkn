const scrape = require('./scrape')
const updateCounter = require('./updateCounter')
const processData = require('./processData')
const beer = require('../models/beer')

const dbImport = () => {
  let data
  scrape()
    .then(output => {
      data = output
      return updateCounter()
    })
    .then(result => {
      const counter = result.counter
      let processedData = processData(data, counter)
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
