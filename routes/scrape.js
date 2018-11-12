const rp = require('request-promise')
const cheerio = require('cheerio')
const config = require('./../config')

const scrape = () => {
  console.time('test')
  console.log('Requesting data...')
  const request = rp(config.scraper.uri)
    .then(function (html) {
      console.log('Succesfully requested data')
      const $ = cheerio.load(html)
      let aanbiedingen = $('div.textaanbieding')
      let data = []
      console.log('Storing objects in array...')
      aanbiedingen.each(function () {
        let brand = $(this).find('span.merk').text()
        if (brand.includes('0.0')) {
          return true // It's not beer when there is no alcohol in it
        }
        let store = $(this).find('img')[0].attribs.title
        let oldPrice = $(this).find('del').text()
        let newPrice = $(this).find('span.prijs').text()
        let volume = $(this).find('.Blikjes, .Flessen, .Kratten, .Fusten').text()
        let rawValidity = $(this).find('p:nth-child(1)').text().trim()
        let rawUri

        if ($(this).find('a.button.yellow.aanbtn').length > 0) {
          rawUri = $(this).find('a.button.yellow.aanbtn')[0].attribs.href
        }

        if (rawUri) {
          data.push({ brand, store, oldPrice, newPrice, volume, rawUri, rawValidity })
        } else {
          data.push({ brand, store, oldPrice, newPrice, volume, rawValidity })
        }
      })
      console.log('Succesfully stored objects in array')
      return data
    })
  return request
}

module.exports = scrape
