const prettyPrice = (price) => {
  price = parseFloat(price.replace(/,/, '.').replace(/€/, ''))
  return price
}

module.exports = prettyPrice
