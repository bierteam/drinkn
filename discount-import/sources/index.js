const ah = require('./ah')
const biernet = require('./biernet')

// The registry the pipeline iterates. Adding a retailer is adding a file here
// and a line below -- nothing in services/importProducts.js knows the name of
// any source.
const sources = [biernet, ah]

module.exports = sources
