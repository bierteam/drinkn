const rp = require('request-promise')

const requestData = async (context) => {
  const options = { // move to envirioment variable?
    uri: `https://biernet.nl/extra/app/V3_3.3.4/${context}.php?d=`,
    headers: {
      'User-Agent': 'nl.Biernet.iOS.app/V3',
      Accept: 'application/json, text/plain, /',
      'Accept-Language': 'nl-nl',
      Connection: 'close'
      // TODO implement: 'Accept-Encoding': 'gzip, deflate'
    },
    json: true // Automatically parses the JSON string in the response
  }
  const response = await rp(options)
  return response
}

module.exports = requestData
