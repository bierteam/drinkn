const storeMapping = require('./storeMapping')
const uriPrettifier = require('./uriPrettifier')
const updateCounter = require('../routes/updateCounter')

const processData = (data) => {
  const counter = updateCounter()
  console.log('counter test: ' + counter)
  for (let obj in data) {
    data[obj].store = storeMapping(data[obj].store)

    if (data[obj].rawUri) {
      data[obj].uri = uriPrettifier(data[obj].rawUri)
    }
    data[obj].counter = counter
  }
  return data
}

module.exports = processData
