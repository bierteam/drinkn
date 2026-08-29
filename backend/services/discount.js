const beer = require('../models/beer')

const pr = process.env.PR || false
const sort = pr ? { validity: -1 } : {} // most recently valid first
const limit = pr ? 100 : 0

const discount = async () => {
  try {
    // the filter is built per call on purpose: it used to be assigned once at
    // module load, which froze the validity cutoff at process start, so
    // offers that expired while the server was up were still served
    const filter = pr ? {} : { validity: { $gte: new Date() } }
    const result = await beer.find(filter).sort(sort).limit(limit).exec()
    return result
  } catch (err) {
    console.error(err)
    return []
  }
}

module.exports = discount
