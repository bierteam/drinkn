const uriPrettifier = require('./uriPrettifier')
const prettyPrice = require('./prettyPrice')
const updateStores = require('./updateStores')
const revHash = require('rev-hash')
const moment = require('moment')
moment.locale('nl')

const processData = (data, counter, stores) => {
  let newStores = {}
  let storeMap
  if (stores) {
    storeMap = new Map(Object.entries(stores))
    newStores = stores
  }

  for (let obj in data) {
    if (!newStores[data[obj].store]) {
      newStores[data[obj].store] = data[obj].store
    }

    if (storeMap && storeMap.get(data[obj].store)) {
      data[obj].rawStore = data[obj].store
      data[obj].store = storeMap.get(data[obj].store)
    }

    data[obj].id = revHash(data[obj].id)

    let validity = data[obj].rawValidity.replace(/(.*)t\/m /g, '')

    if (moment(validity, 'dddd DD MMMM').isValid()) {
      data[obj].validity = moment(validity, 'dddd DD MMMM').toDate()
    }

    data[obj].importDate = moment().toDate()

    let tmp = {}
    tmp.oldPrice = prettyPrice(data[obj].pricing.rawOldPrice)
    tmp.newPrice = prettyPrice(data[obj].pricing.rawNewPrice)
    tmp.literPrice = prettyPrice(data[obj].pricing.rawLiterPrice)

    data[obj].pricing.oldPrice = tmp.oldPrice * 100
    data[obj].pricing.newPrice = tmp.newPrice * 100
    data[obj].pricing.literPrice = tmp.literPrice * 100

    if (data[obj].rawUri) {
      data[obj].uri = uriPrettifier(data[obj].rawUri)
    }

    data[obj].batch = counter
  }
  updateStores(newStores)
  return data
}

module.exports = processData
