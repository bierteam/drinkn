const counter = require('../models/counter')

const updateCounter = () => {
  counter.findOneAndUpdate({}, { $inc: { counter: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true }, function (err, obj) {
    if (err) {
      console.error(err)
    }
    console.log('een ' + obj.counter)
    return obj.counter
  })
}

module.exports = updateCounter
