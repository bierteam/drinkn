const prettyPrice = (price) => {
  price = parseInt(price.replace(/,/, '.').replace(/€/, ''))

  return price
}

module.exports = prettyPrice
