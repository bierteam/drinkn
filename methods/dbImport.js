const requestData = require('./requestData')
const joinObjects = require('./joinObjects')

const dbImport = () => {
  requestData('aanbieding').then(function (aanbiedingen) {
    requestData('soort').then(function (soorten) {
      joinObjects(aanbiedingen, soorten, 'soort_uid', 'uid')
    })
  })
}

module.exports = dbImport