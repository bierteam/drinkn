const storeMapping = require('./storeMapping')

const processData = (data) => {
  for (let obj in data) {
    data[obj].store = storeMapping(data[obj].store)
  }
  return data
}

module.exports = processData
