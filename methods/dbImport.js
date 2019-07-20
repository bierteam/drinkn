const requestData = require('./requestData')
const joinObjects = require('./joinObjects')

const endPoints = ['soort', 'winkel', 'inhoud', 'inhoud_soort', 'land', 'merken', 'merken_soort', 'nieuws', 'plaats', 'provincie', 'agenda', 'bierkoerier', 'brouwerij', 'gisting', 'home', 'set_next_open']

const dbImport = async () => {
  let aanbiedingen = await requestData('aanbieding')
  for (let endPoint in endPoints) {
    let currentResponse = await requestData(endPoints[endPoint])
    let currentEndPoint = endPoints[endPoint]
    let currentUid = currentEndPoint + '_uid'
    aanbiedingen = await joinObjects(aanbiedingen, currentResponse, currentUid, 'uid', currentEndPoint)
    // console.log(currentResponse)
  }
  console.log(aanbiedingen)
}

module.exports = dbImport
