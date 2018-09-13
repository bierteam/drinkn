const puppeteer = require('puppeteer');
let winkelUri = 'https://www.biernet.nl/bier/aanbiedingen';

let scrape = async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto(winkelUri);
  await page.waitFor(1000);

  const result = await page.evaluate(() => {
    let data = [];
    let aanbiedingen = document.getElementsByClassName('textaanbieding');

    for (let aanbieding of aanbiedingen){
      let winkel = aanbieding.querySelector('div.textaanbieding > div.fotowinkel > a > img').title;
      let merk  = aanbieding.getElementsByClassName('merk')[0].innerText;
      let prijsOud = aanbieding.getElementsByClassName('prijsboven')[0].innerText.split("\n")[0];
      let prijsNieuw = aanbieding.getElementsByClassName('prijs')[0].innerText;
      let hoeveelheid = aanbieding.querySelectorAll('.Blikjes, .Flessen, .Kratten, .Fusten')[0].innerText;
      let geldigheid = aanbieding.getElementsByClassName('nomargin')[0].innerText;
      let uri;
      if (aanbieding.querySelector('div.textaanbieding > a.button.yellow.aanbtn')) {
        uri = aanbieding.querySelector('div.textaanbieding > a.button.yellow.aanbtn').href;
      }

      if (uri) {
        data.push({winkel, merk, prijsOud, prijsNieuw, hoeveelheid, geldigheid, uri});
      } else {
        data.push({winkel, merk, prijsOud, prijsNieuw, hoeveelheid, geldigheid});
      }
    }
    return {
      data
    }
  });

  browser.close();
  return result
};

scrape().then((value) => {
  console.log(JSON.stringify(value));
});
