const mongoose = require('mongoose')

const beerSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true
  },
  store: {
    type: String,
    required: true
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
  batch: {
    type: Number,
    required: true
  }
})

const beer = mongoose.model('beer', beerSchema)
module.exports = beer
