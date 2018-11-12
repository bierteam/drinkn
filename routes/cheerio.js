const rp = require('request-promise')
const cheerio = require('cheerio')
const config = require('./../config')
var fs = require('fs')

rp(config.scraper.uri)
  .then(function (html) {
    const $ = cheerio.load(html)
    let aanbiedingen = $('div.textaanbieding')
    let data = []
    const newPrices = $('span.prijs')
    const oldPrices = $('del')
    const stores = $('div.fotowinkel > a > img')
    const volumes = $('.Blikjes, .Flessen, .Kratten, .Fusten')
    for (let i = 0; i < aanbiedingen.length; i++) {
      let store = stores[i].attribs.title
      let oldPrice = oldPrices[i].children[0].data
      let newPrice = newPrices[i].children[0].data
      let volume = volumes[i].children[0].data
      data.push({ store, oldPrice, newPrice, volume })
    }
    fs.writeFile('cdata.json', JSON.stringify(data),
      function (err) {
        if (err) throw err
        console.log('data is written to file successfully.')
      })
  })
  .catch(function (err) {
    console.error(err)
  })
