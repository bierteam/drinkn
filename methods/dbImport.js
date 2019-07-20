const requestData = require('./requestData')
const joinObjects = require('./joinObjects')

const endPoints = ['soort', 'winkel', 'inhoud']

const dbImport = async () => {
  let aanbiedingen = await requestData('aanbieding')
  for (let endPoint in endPoints) {
    let currentResponse = await requestData(endPoints[endPoint])
    let currentEndPoint = endPoints[endPoint]
    let currentUid = currentEndPoint + '_uid'
    aanbiedingen = await joinObjects(aanbiedingen, currentResponse, currentUid, 'uid', currentEndPoint)
  }
  console.log(aanbiedingen)
}

module.exports = dbImport
