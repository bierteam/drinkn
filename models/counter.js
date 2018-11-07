const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema({
  counter: {
    type: Number,
    default: 0,
    required: true,
    unique: true
  }
})

const counter = mongoose.model('counter', counterSchema)
module.exports = counter
