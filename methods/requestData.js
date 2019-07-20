const rp = require('request-promise')

const requestData = async (context) => {
  let currentUri = `http://biernet.nl/extra/app/V3_3.3.4/${context}.php?d=`
  console.log(currentUri)
  const rawResponse = await rp(currentUri)
  const parsedResponse = JSON.parse(rawResponse)
  return parsedResponse
}

module.exports = requestData
