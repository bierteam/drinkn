const beer = require('../models/beer')

let filter = { validity: { $gte: Date() } }
let sort = {}
let limit = 0

const pr = process.env.PR || false
if (pr) {
  filter = {}
  sort = { validity: -1 } // Sorting by validity in ascending order
  limit = 100
}

const discount = async () => {
  try {
    const result = await beer.find(filter).sort(sort).limit(limit).exec()
    return result
  } catch (err) {
    console.error(err)
    return []
  }
}

module.exports = discount
