const requestData = require('./requestData')
const joinObjects = require('./joinObjects')
const writeLog = require('./writeLog')
const context = 'Import'
const endPoints = ['soort', 'winkel', 'inhoud', 'inhoud_soort', 'land', 'merken', 'merken_soort', 'nieuws', 'plaats', 'provincie', 'agenda', 'bierkoerier', 'brouwerij', 'gisting', 'home', 'set_next_open']

const getData = async () => {
  writeLog('Requesting data to import', 'Info', context)
  let discounts = await requestData('aanbieding')

  for (const endPoint of Object.values(endPoints)) {
    const currentResponse = await requestData(endPoint)
    const currentUid = endPoint + '_uid'
    discounts = await joinObjects(discounts, currentResponse, currentUid, 'uid', endPoint)
  }

  return discounts
}

module.exports = getData
