const mongoose = require('mongoose')

const storeSchema = new mongoose.Schema({
  store: {
    type: Map,
    of: String
  }
})

const store = mongoose.model('store', storeSchema)
module.exports = store
