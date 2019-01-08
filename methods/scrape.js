const rp = require('request-promise')
const cheerio = require('cheerio')
const config = require('./../config')

const scrape = async () => {
  const html = await rp(config.scraper.uri)
  console.log('Succesfully requested data')
  const $ = cheerio.load(html)
  let aanbiedingen = await $("li[data-url^='/JM']")
  let data = []
  await aanbiedingen.each(function () {
    let id = $(this).find('a').attr('href')
    let brand = $(this).find('span.m').text()
    let store = $(this).find("img[width='45px']").attr('title')
    let rawOldPrice = $(this).find('del').text()
    let rawNewPrice = $(this).find('span.prijs').text()
    let rawLiterPrice = $(this).find('span.ltrprijs').text()
    let volume = $(this).find('.Blikjes, .Flessen, .Kratten, .Fusten').text()
    let rawValidity = $(this).find('p:nth-child(1)').text().trim()
    let rawUri, pricing

    pricing = { rawOldPrice, rawNewPrice, rawLiterPrice }

    if ($(this).find('a.button.yellow.aanbtn').length > 0) {
      rawUri = $(this).find('a.button.yellow.aanbtn')[0].attribs.href
    }

    if (rawUri) {
      data.push({ id, brand, store, pricing, volume, rawUri, rawValidity })
    } else {
      data.push({ id, brand, store, pricing, rawNewPrice, volume, rawValidity })
    }
  })
  console.log('Succesfully stored objects in array')
  return data
}

module.exports = scrape
