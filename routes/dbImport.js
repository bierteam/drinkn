const scrape = require('./scrape')
const processData = require('./processData')
const beer = require('../models/beer')

const dbImport = () => {
  scrape().then((array) => {
    let cleanedData = processData(array.data)
    for (let obj in cleanedData) {
      let beerData = {
        brand: cleanedData[obj].brand,
        store: cleanedData[obj].store,
        oldPrice: cleanedData[obj].oldPrice,
        newPrice: cleanedData[obj].newPrice,
        volume: cleanedData[obj].volume,
        rawUri: cleanedData[obj].rawUri
      }
      beer.create(beerData, function (err, beer) {
        if (err) {
          console.log(err)
        }
      })
    }
    console.log(`${cleanedData.length} document(s) inserted`)
  }
  )
}

module.exports = dbImport
