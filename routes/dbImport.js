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

  const result = await page.evaluate(() => {
    let data = [];
    let aanbiedingen = document.getElementsByClassName("textaanbieding");

    for (let aanbieding of aanbiedingen){
      let merk  = aanbieding.getElementsByClassName("merk")[0].innerText;
      if (merk.includes("0.0")) {
        continue; // It's not beer when there is no alcohol in it.
      }
      let winkel = aanbieding.querySelector("div.textaanbieding > div.fotowinkel > a > img").title;
      let prijsOud = aanbieding.getElementsByClassName("prijsboven")[0].innerText.split("\n")[0];
      let prijsNieuw = aanbieding.getElementsByClassName("prijs")[0].innerText;
      let hoeveelheid = aanbieding.querySelectorAll(".Blikjes, .Flessen, .Kratten, .Fusten")[0].innerText;
      let geldigheid = aanbieding.getElementsByClassName("nomargin")[0].innerText;
      let uri;

      if (aanbieding.querySelector("div.textaanbieding > a.button.yellow.aanbtn")) {
        uri = aanbieding.querySelector("div.textaanbieding > a.button.yellow.aanbtn").href;
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

const moveData = () => {
  MongoClient.connect(connectionString,{ useNewUrlParser: true }, function(err, client) {
    if (err) throw err;
    let dbo = client.db(config.db.name);

    dbo.collection("Pils").find({}).toArray(function(err, result) {
      if (err) throw err;
      dbo.collection("PilsArchive").insertMany(result, function(err, res) {
        if (err) throw err;
        console.log( `${result.length} document(s) inserted in ${config.db.host}:${config.db.name}/PilsArchive`);
      });

      dbo.collection("Pils").deleteMany({},function(err, result) { //removes all old documents
        if (err) throw err;
    });

    client.close();
    });
  });
};


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



//move to archive
// const moveData = () => {
//   MongoClient.connect(connectionString,{ useNewUrlParser: true }, function(err, client) {
//     if (err) throw err;
//     let dbo = client.db(config.db.name);

//     dbo.collection("Pils").find({}).toArray(function(err, result) {
//       if (err) throw err;
//       dbo.collection("PilsArchive").insertMany(result, function(err, res) {
//         if (err) throw err;
//         console.log( `${result.length} document(s) inserted in ${config.db.host}:${config.db.name}/PilsArchive`);
//       });

//       dbo.collection("Pils").deleteMany({},function(err, result) { //removes all old documents
//         if (err) throw err;
//     });

//     client.close();
//     });
//   });
// };


//empty collection
// MongoClient.connect(connectionString,{ useNewUrlParser: true }, function (err, client) {
//   if (err) throw err;
//   const db = client.db(config.db.name);
//   db.collection("PilsArchive").deleteMany({},function(err, result) {
//     if (err) throw err;
//   });
//   client.close();
// });

// dbImport()
module.exports = dbImport;
