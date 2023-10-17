const uriPrettifier = require('./uriPrettifier')
const updateStores = require('./updateStores')
const moment = require('moment')
moment.locale('nl')
const validateKeys = require('./validateKeys')
const mandatoryKeys = ['id', 'brand', 'store', 'pricing', 'volume', 'rawValidity']
const crypto = require('crypto');
// TODO: Fix this
// const beer = require('../models/beer')
// const mandatoryKeys = beer.schema._requiredpaths

const processData = (data, stores) => {
  let newStores = {}
  let storeMap
  if (stores) {
    storeMap = new Map(Object.entries(stores))
    newStores = stores
  }

  for (let obj = data.length; obj--;) {
    data[obj].store = data[obj].winkel_name
    data[obj].brand = data[obj].merken_name
    data[obj].pricing = {}
    data[obj].pricing.rawOldPrice = data[obj].vanprijs
    data[obj].pricing.rawNewPrice = data[obj].voorprijs
    data[obj].volume = data[obj].korte_name
    data[obj].rawUri = data[obj].aanbieding_link
    data[obj].rawValidity = data[obj].einddatum
    data[obj].id = crypto.createHash('md5').update(data[obj].uid).digest('hex').slice(0, 10)
    delete data[obj].merken_soort_omschrijving
    delete data[obj].brouwerij_omschrijving
    delete data[obj].gisting_omschrijving

    // Don't touch this devil
    if (validateKeys(data[obj], mandatoryKeys) === false) {
      data.splice(obj, 1)
      continue
    }

    if (data[obj].alcoholpercentage) {
      data[obj].rawAlcoholpercentage = parseFloat(data[obj].alcoholpercentage).toFixed(2)
      data[obj].alcoholPercentage = data[obj].rawAlcoholpercentage * 100
    }
    if (data[obj].kleur) {
      data[obj].color = data[obj].kleur
    }
    if (data[obj].aantal_liter) {
      data[obj].rawLiter = data[obj].aantal_liter
      data[obj].liter = data[obj].rawLiter * 1000
    }
    if (!newStores[data[obj].store]) {
      newStores[data[obj].store] = data[obj].store
    }
    if (storeMap?.get(data[obj].store)) {
      data[obj].rawStore = data[obj].store
      data[obj].store = storeMap.get(data[obj].store)
    }
    if (moment(data[obj].rawValidity, 'dddd DD MMMM').isValid()) {
      data[obj].validity = moment(data[obj].rawValidity, 'dddd DD MMMM').add(1, 'days').toDate()
    }
    if (data[obj].rawUri) {
      data[obj].uri = uriPrettifier(data[obj].rawUri)
    }

    data[obj].importDate = moment().toDate()
    data[obj].pricing.oldPrice = data[obj].pricing.rawOldPrice * 100
    data[obj].pricing.newPrice = data[obj].pricing.rawNewPrice * 100
    data[obj].pricing.literPrice = data[obj].pricing.newPrice / data[obj].liter * 10
  }
  updateStores(newStores)
  return data
}

module.exports = processData
