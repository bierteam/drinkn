const config = require('./../config')
const uriPrettifier = require('./uriPrettifier')
const prettyPrice = require('./prettyPrice')
const updateStores = require('./updateStores')
const moment = require('moment')
moment.locale('nl')

const fuzzyset = require('fuzzyset')
const storeArray = fuzzyset(config.stores)

const processData = (data, counter, stores) => {
  let newStores = {}
  if (stores) {
    newStores = JSON.parse(JSON.stringify(stores))
  }

  for (let obj in data) {
    let currentStore = (data[obj].store).toString()
    data[obj].store = storeArray.get(currentStore)[0][1]

    if (!newStores[currentStore]) {
      newStores[currentStore] = currentStore
    }

    // TODO add this stuff:
    // https://github.com/bierteam/Pils/commit/a2cfc8bc905358c500d8a238b4d3ec5d2fa71829#diff-472a3763db6d58bce99240a546e97bc5

    let validity = data[obj].rawValidity.replace(/(.*)t\/m /g, '')

    if (moment(validity, 'dddd DD MMMM').isValid()) {
      data[obj].validity = moment(validity, 'dddd DD MMMM').toDate()
    }

    data[obj].importDate = moment().toDate()

    let tmp = {}
    tmp.oldPrice = prettyPrice(data[obj].pricing.rawOldPrice)
    tmp.newPrice = prettyPrice(data[obj].pricing.rawNewPrice)

    data[obj].pricing.oldPrice = tmp.oldPrice * 100
    data[obj].pricing.newPrice = tmp.newPrice * 100

    if (data[obj].rawUri) {
      data[obj].uri = uriPrettifier(data[obj].rawUri)
    }

    data[obj].batch = counter
  }
  // console.log(newStores)
  updateStores(newStores)
  return data
}

module.exports = processData
