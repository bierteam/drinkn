const rp = require('request-promise')

const requestData = async (context) => {
  const rawResponse = await rp(`http://biernet.nl/extra/app/V3_3.3.4/${context}.php?d=`)
  const parsedResponse = JSON.parse(rawResponse)
  return parsedResponse
}

module.exports = requestData
