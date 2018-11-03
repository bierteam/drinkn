const beer = require('../models/beer')
// const storeQuery = beer.find({}).distinct('store')

const getStores = () => {
  let store = beer.find({}).distinct('store').exec()
  return store
}

let stores = getStores()
stores.then(function (data) {
  // console.log(data)
})

// getStores()
module.exports = getStores
