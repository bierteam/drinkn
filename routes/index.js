const express = require('express');
const bodyParser = require('body-parser');
const app = express()
const router = express.Router();



app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
const MongoClient = require('mongodb').MongoClient;
const url = "ENTER DB CONNECTION STRING";


// Home
router.get('/', function (req, res) {
  res.render('home');
})


// /Aanbiedingen
router.get('/aanbiedingen', function (req, res) {
  res.render('aanbiedingen', {pilsDataResponse: 0});
})


router.post('/aanbiedingen', function (req, res) {
  let bierMerk = req.body.merk; //assigns user input to variable
  bierMerk = bierMerk.toLowerCase(); // to lower case for case insensitive comparison
  console.log(`The current user input is ${bierMerk}`);
  MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    let dbo = db.db("nino");
    dbo.collection("Pils").find({}).toArray(function(err, result) {
      if (err) throw err;
      let pilsData = result;
      matchingPilsData = []; //array to store all results
      for (let pils of pilsData){
        let pilsMerk = String(pils.merk).toLowerCase(); //creates (lowercase) string of current pils merk
        if (pilsMerk.includes(bierMerk)){ // compares user input bierMerk to scraped data pilsMerk
          matchingPilsData.push(pils); // adds current object to array if merk matches
        }
      }
      res.render('aanbiedingen', {pilsDataResponse: matchingPilsData.sort()}); //renders data to ejs file
      db.close();
    });
  });
});


module.exports = router;