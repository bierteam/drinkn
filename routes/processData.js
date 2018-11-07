const config = require('./../config')
// const storeMapping = require('./storeMapping')
const uriPrettifier = require('./uriPrettifier')
const moment = require('moment')
moment.locale('nl')

let storeMap = new Map(Object.entries(config.stores))

const processData = (data, counter) => {
  for (let obj in data) {
    // data[obj].store = storeMapping(data[obj].store)
    if (storeMap.get(data[obj].store)) {
      data[obj].store = storeMap.get(data[obj].store)
    }

    let validity = data[obj].rawValidity.replace(/(.*)t\/m /g, '')
    data[obj].validity = moment(validity, 'dddd DD MMMM').toDate()

    data[obj].importDate = moment().toDate()

    if (data[obj].rawUri) {
      data[obj].uri = uriPrettifier(data[obj].rawUri)
    }

    data[obj].batch = counter
  }
  return data
}

module.exports = processData
