const beer = require('../models/beer')

const aanbieding = () => {
  return new Promise((resolve) => {
    beer.find({ validity: { $gte: Date() } }).exec(async function (err, result) {
      if (err) console.error(err)
      resolve(result)
    })
  })
}

module.exports = aanbieding
