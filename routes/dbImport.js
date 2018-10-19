const puppeteer = require('puppeteer');
const MongoClient = require('mongodb').MongoClient;

const config = require('./../config');
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`;

let scrape = async () => {
  console.log("Launching browser");
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  console.log("Loading page");
  await page.goto(config.scraper.uri);

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
  console.log("Succesfully processed data");
  browser.close();
  return result
};


scrape().then((value) => {
  MongoClient.connect(connectionString, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    let dbo = db.db(config.db.name);
    let myObject = value.data;
    dbo.collection("Pils").insertMany(myObject, function(err, res) {
      if (err) throw err;
      console.log( `${myObject.length} document(s) inserted in ${config.db.host}:${config.db.name}/Pils`);
    });

    db.close();
    });
  });


  // MongoClient.connect(connectionString,{ useNewUrlParser: true }, function(err, db) {
  // if (err) throw err;
  // let dbo = db.db(config.db.name);
  // dbo.collection("Pils").find({}).toArray(function(err, result) {
  //   if (err) throw err;
  //   let pilsData = result;
  //   pilsData.forEach(function(doc) {
  //     dbo.collection("PilsArchive").insert(doc);
  //     dbo.collection("Pils").remove(doc);
  // })
  // db.close();
  // })});
