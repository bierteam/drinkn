const mongoose = require('mongoose')

const logSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  context: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: false
  }
})

const log = mongoose.model('log', logSchema)
module.exports = log
