const requestData = require('./requestData')
const joinObjects = require('./joinObjects')
const writeLog = require('./writeLog')
const context = 'Import'
const endPoints = ['soort', 'winkel', 'inhoud', 'inhoud_soort', 'land', 'merken', 'merken_soort', 'nieuws', 'plaats', 'provincie', 'agenda', 'bierkoerier', 'brouwerij', 'gisting', 'home', 'set_next_open']

const getData = async () => {
  writeLog('Requesting data from aanbieding', 'Info', context)
  let aanbiedingen = await requestData('aanbieding')
  for (const endPoint in endPoints) {
    writeLog(`Requesting data from ${endPoints[endPoint]}`, 'Info', context)
    const currentResponse = await requestData(endPoints[endPoint])
    const currentEndPoint = endPoints[endPoint]
    const currentUid = currentEndPoint + '_uid'
    writeLog('Attempting to join objects', 'Info', context)
    aanbiedingen = await joinObjects(aanbiedingen, currentResponse, currentUid, 'uid', currentEndPoint)
  }
  return aanbiedingen
}

module.exports = getData
