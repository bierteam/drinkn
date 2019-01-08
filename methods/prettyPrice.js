const prettyPrice = price => {
  price = parseFloat(price.replace(/,/, '.').replace(/€/, '')).toFixed(2)
  return price
}

module.exports = prettyPrice
