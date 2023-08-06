const beer = require('../models/beer')

const discount = async () => {
  try {
    const result = await beer.find({ validity: { $gte: Date() } }).exec()
    return result
  } catch (err) {
    console.error(err)
    return []
  }
}

module.exports = discount
