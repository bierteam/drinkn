const puppeteer = require('puppeteer')

const scrape = async () => {
  console.log('Launching browser')
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  console.log('Loading page')
  await page.goto(config.scraper.uri)

  const result = await page.evaluate(() => {
    let data = []
    let aanbiedingen = document.getElementsByClassName('textaanbieding')
    let importDate = Date.now()

    for (let aanbieding of aanbiedingen) {
      let brand = aanbieding.getElementsByClassName('merk')[0].innerText
      if (brand.includes('0.0')) {
        continue // It's not beer when there is no alcohol in it
      }
      let store = aanbieding.querySelector('div.textaanbieding > div.fotowinkel > a > img').title
      let oldPrice = aanbieding.getElementsByClassName('prijsboven')[0].innerText.split('\n')[0]
      let newPrice = aanbieding.getElementsByClassName('prijs')[0].innerText
      let volume = aanbieding.querySelectorAll('.Blikjes, .Flessen, .Kratten, .Fusten')[0].innerText
      let rawValidity = aanbieding.getElementsByClassName('nomargin')[0].innerText
      let rawUri
      let uri

      if (aanbieding.querySelector('div.textaanbieding > a.button.yellow.aanbtn')) {
        rawUri = aanbieding.querySelector('div.textaanbieding > a.button.yellow.aanbtn').href
        // uri = rawUri.split(/ion\:(.*)/g);
        // uri = uri[1];
        // uri = uri.replace("%2F", "/");
      }

      if (rawUri) {
        data.push({ brand, store, oldPrice, newPrice, volume, rawValidity, importDate, rawUri })
      } else {
        data.push({ brand, store, oldPrice, newPrice, volume, rawValidity, importDate })
      }
    }
    return {
      data
    }
  })
  console.log('Succesfully processed data')
  await browser.close()
  console.log(result) // debugging
  return result
}

module.exports = scrape
