const rp = require('request-promise')
const cheerio = require('cheerio')
const config = require('./../config')

const url = config.scraper.uri
rp(url)
  .then(function (html) {
    const $ = cheerio.load(html)
    let aanbiedingen = $('div.textaanbieding')
    let data = []
    for (let i = 0; i < aanbiedingen.length; i++) {
      let store = ($('div.fotowinkel > a > img')[i].attribs.title)
      let oldPrice = $('h2 > a > span')[i].children[0].data
      let newPrice = $('span.prijs')[i].children[0].data
      let volume = $('.Blikjes, .Flessen, .Kratten, .Fusten')[i].children[0].data
      data.push({ store, oldPrice, newPrice, volume })
    }
    console.log(data)
  })
