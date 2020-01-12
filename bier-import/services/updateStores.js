const store = require('../models/store')

function updateStores (newStores) {
  store.updateOne(
    {},
    { $set: newStores },
    {
      strict: false,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    },
    function (err, result) {
      if (err) console.error(err)
    })
}

module.exports = updateStores
