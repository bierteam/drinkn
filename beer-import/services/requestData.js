const axios = require('axios')

const requestData = async (context) => {
  const headers = {
    'User-Agent': 'nl.Biernet.iOS.app/V3',
    Accept: 'application/json, text/plain, /',
    'Accept-Language': 'nl-nl',
    Connection: 'close',
    'Accept-Encoding': 'gzip, deflate'
  }

  const url = `https://biernet.nl/extra/app/V3_3.3.4/${context}.php?d=`

  try {
    const response = await axios.get(url, { headers, responseType: 'json' })
    return response.data
  } catch (error) {
    console.error('Error while requesting data:', error.message)
    throw error
  }
}

module.exports = requestData
