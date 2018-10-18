const puppeteer = require('puppeteer');
const MongoClient = require('mongodb').MongoClient;

const config = require('./../config');
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`;

let scrape = async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto(config.scraper.uri);
  await page.waitFor(1000);

  const result = await page.evaluate(() => {
    let data = [];
    let aanbiedingen = document.getElementsByClassName('textaanbieding');

    for (let aanbieding of aanbiedingen){
      let merk  = aanbieding.getElementsByClassName('merk')[0].innerText;
      if (merk.includes('0.0')) {
        continue; // It's not beer when there is no alcohol in it.
      }
      let winkel = aanbieding.querySelector('div.textaanbieding > div.fotowinkel > a > img').title;
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
  console.log("Succesfully retrieved data");
  browser.close();
  return result
};


scrape().then((value) => {
  MongoClient.connect(connectionString, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    let dbo = db.db("nino");
    let myObject = value.data;
    for (obj in myObject){
      dbo.collection("Pils").insertOne(myObject[obj], function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
      }
    );
    }
    db.close();
    });
  });
