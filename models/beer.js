const mongoose = require('mongoose')

let beerSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true
  },
  store: {
    type: String,
    required: true
  },
  oldPrice: {
    type: String,
    required: true
  },
  newPrice: {
    type: String,
    required: true
  },
  volume: {
    type: String,
    required: true
  },
  rawUri: {
    type: String,
    required: false
  }
})

let beer = mongoose.model('beer', beerSchema)
module.exports = beer
