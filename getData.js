const puppeteer = require('puppeteer');
let winkel = 'https://www.biernet.nl/bier/aanbiedingen/bij/albert-heijn'


let scrape = async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.goto(winkel);
    await page.waitFor(1000);

    const result = await page.evaluate(() => {
        let data = [];
        let aanbiedingen = document.getElementsByClassName('textaanbieding');

        for (let aanbieding of aanbiedingen){
            let merk  = aanbieding.getElementsByClassName('merk')[0].innerText;
            let prijsOud = aanbieding.getElementsByClassName('prijsboven')[0].innerText.split("\n")[0];
            let prijsNieuw = aanbieding.getElementsByClassName('prijs')[0].innerText;
            let hoeveelheid = aanbieding.querySelectorAll('.Blikjes, .Flessen, .Kratten')[0].innerText;
            let geldigheid = aanbieding.getElementsByClassName('nomargin')[0].innerText;

            data.push({merk, prijsOud, prijsNieuw, hoeveelheid, geldigheid});

        }
        return {
            data
        }

    });

    browser.close();
    return result
  };

  scrape().then((value) => {
      console.log(value);
  });
