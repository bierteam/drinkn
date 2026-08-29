const mongoose = require('mongoose')

const beerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  brand: {
    type: String,
    required: true
  },
  store: {
    type: String,
    required: true
  },
  rawStore: {
    type: String,
    required: false
  },
  pricing: {
    rawOldPrice: {
      type: String,
      required: true
    },
    rawNewPrice: {
      type: String,
      required: true
    },
    oldPrice: {
      type: Number,
      required: true
    },
    newPrice: {
      type: Number,
      required: true
    },
    literPrice: {
      type: Number,
      required: true
    }
  },
  volume: {
    type: String,
    required: true
  },
  rawUri: {
    type: String,
    required: false
  },
  uri: {
    type: String,
    required: false
  },
  rawValidity: {
    type: String,
    required: true
  },
  validity: {
    type: Date,
    required: false
  },
  importDate: {
    type: Date,
    required: true
  },
  color: {
    type: String,
    required: false
  },
  alcoholPercentage: {
    type: Number,
    required: false
  },
  liter: {
    type: Number,
    required: false
  }
}, { autoIndex: true })

const beer = mongoose.model('beer', beerSchema)
module.exports = beer
