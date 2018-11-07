const counter = require('../models/counter')

function updateCounter () {
  return new Promise((resolve, reject) => {
    counter.findOneAndUpdate(
      {},
      { $inc: { counter: 1 } },
      { new: true,
        upsert: true,
        setDefaultsOnInsert: true },
      (err, doc) => {
        if (err) {
          reject(err)
        } else {
          resolve(doc)
        }
      })
  })
}

module.exports = updateCounter
