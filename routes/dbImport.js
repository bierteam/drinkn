const puppeteer = require("puppeteer");
const MongoClient = require("mongodb").MongoClient;
const config = require("./../config");
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`;

const scrape = async () => {
  console.log("Launching browser");
  const browser = await puppeteer.launch({args: ["--no-sandbox"]});
  const page = await browser.newPage();
  console.log("Loading page");
  await page.goto(config.scraper.uri);
  await page.screenshot({path: 'screenshot.png'}); // test

  const result = await page.evaluate(() => {
    let data = [];
    let aanbiedingen = document.getElementsByClassName("textaanbieding");
    let importDate = Date.now();
    // let importSerial = getSerial()

    for (let aanbieding of aanbiedingen){
      let brand  = aanbieding.getElementsByClassName("merk")[0].innerText;
      if (brand.includes("0.0")) {
        continue; // It's not beer when there is no alcohol in it
      }
      let store = aanbieding.querySelector("div.textaanbieding > div.fotowinkel > a > img").title;
      let oldPrice = aanbieding.getElementsByClassName("prijsboven")[0].innerText.split("\n")[0];
      let newPrice = aanbieding.getElementsByClassName("prijs")[0].innerText;
      let volume = aanbieding.querySelectorAll(".Blikjes, .Flessen, .Kratten, .Fusten")[0].innerText;
      let rawValidity = aanbieding.getElementsByClassName("nomargin")[0].innerText;
      let rawUri;
      let uri;

      // if (aanbieding.querySelector("div.textaanbieding > a.button.yellow.aanbtn")) {
      //   rawUri = aanbieding.querySelector("div.textaanbieding > a.button.yellow.aanbtn").href;
      //   uri = rawUri.split(/ion\:(.*)/g);
      //   uri = uri[1];
      //   uri = uri.replace("%2F", "/");
      // }

      if (uri) {
        data.push({brand, store, oldPrice, newPrice, volume, rawValidity, importDate, rawUri, uri});
      } else {
        data.push({brand, store, oldPrice, newPrice, volume, rawValidity, importDate});
      }
    }
    return {
      data
    }
  });
  console.log("Succesfully processed data");
  await browser.close();
  console.log(result); // debugging
  return result
};

const getSerial = () => {
  MongoClient.connect(connectionString, { useNewUrlParser: true }, function(err, client) {
    if (err) throw err;
    let dbo = client.db(config.db.name);
    dbo.collection(config.db.sCollection).findOne({}, function(err, res) {
      if (err) throw err;
    });
    client.close();
    let serial = null; // debugging
    return serial;
    });
}

const dbImport = () => {
  scrape().then((array) => {
    MongoClient.connect(connectionString, { useNewUrlParser: true }, function(err, client) {
      if (err) throw err;
      let dbo = client.db(config.db.name);

      dbo.collection(config.db.collection).insertMany(array.data, function(err, res) {
        if (err) throw err;
        console.log( `${array.data.length} document(s) inserted in ${config.db.host}:${config.db.name}/${config.db.collection}`);
      });
      client.close();
      });
    })};

const updateCounter = () => {
  MongoClient.connect(connectionString,{ useNewUrlParser: true }, function(err, client) {
    if (err) throw err;
    let dbo = client.db(config.db.name);

    dbo.collection("updated").findOne({}).toArray(function(err, result) {
      if (err) throw err;
      dbo.collection("updated").update(result, function(err, res) {
        if (err) throw err;
      });
    });
    client.close();
  });
};

dbImport()
module.exports = dbImport;
