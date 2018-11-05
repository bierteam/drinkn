const storeMapping = require('./storeMapping')
const uriPrettifier = require('./uriPrettifier')

const processData = (data, counter) => {
  for (let obj in data) {
    data[obj].store = storeMapping(data[obj].store)

    if (data[obj].rawUri) {
      data[obj].uri = uriPrettifier(data[obj].rawUri)
    }
    data[obj].batch = counter
  }
  return data
}

module.exports = processData
