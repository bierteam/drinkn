const config = require('./../config')
const uriPrettifier = require('./uriPrettifier')
const moment = require('moment')
moment.locale('nl')

const fuzzyset = require('fuzzyset')
const storeArray = fuzzyset(config.stores)

const processData = (data, counter) => {
  for (let obj in data) {
    let currentStore = (data[obj].store).toString()
    data[obj].store = storeArray.get(currentStore)[0][1]

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
