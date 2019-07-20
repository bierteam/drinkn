const requestData = require('./requestData')
const joinObjects = require('./joinObjects')

const endPoints = ['agenda', 'bierkoerier', 'brouwerij', 'gisting', 'home', 'inhoud', 'inhoud_soort', 'land', 'merken', 'merken_soort', 'nieuws', 'plaats', 'provincie', 'set_next_open', 'soort', 'winkel']

const dbImport = async () => {
  let aanbiedingen = await requestData('aanbieding')
  let responses = []
  for (let endPoint in endPoints) {
    responses[endPoint] = await requestData(endPoints[endPoint])
  }
  for (let response in responses) {
    let currentResponse = responses[response]
    let currentUid = currentResponse + '_uid'
    aanbiedingen = await joinObjects(aanbiedingen, currentResponse, currentUid, 'uid', currentResponse)
  }
  console.log(responses)
  console.log(aanbiedingen)
}

module.exports = dbImport
