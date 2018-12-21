const counter = require('../models/counter')

function updateCounter () {
  console.log('Attempting to update counter...')
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
          console.log('Succesfully updated counter')
          resolve(doc)
        }
      })
  })
}

module.exports = updateCounter
