const express = require('express');
const bodyParser = require('body-parser');
const app = express()
const router = express.Router();
const user = require('../models/user');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
const MongoClient = require('mongodb').MongoClient;
const config = require('./../config');
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}`;

router.get('/', function (req, res) {
 user.findById(req.session.userId)
 .exec(function (error, user) {
   if (error) {
     console.log(error);
   } else {
     if (user === null) {
      res.redirect('/login');
     } else {
      res.render('home');
     }
   }
 });
});


// /Aanbiedingen
router.get('/aanbiedingen', function (req, res) {
  user.findById(req.session.userId)
  .exec(function (error, user) {
    if (error) {
      console.log(error);
    } else {
      if (user === null) {
       res.redirect('/login');
      } else {
        return res.render('aanbiedingen', {pilsDataResponse: 0});
      }
    }
  });
})


router.post('/aanbiedingen', function (req, res) {
  let bierMerk = req.body.merk; //assigns user input to variable
  bierMerk = bierMerk.toLowerCase(); // to lower case for case insensitive comparison
  console.log(`The current user input is ${bierMerk}`);
  MongoClient.connect(connectionString,{ useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    let dbo = db.db(config.db.name);
    dbo.collection("Pils").find({}).toArray(function(err, result) {
      if (err) throw err;
      let pilsData = result;
      matchingPilsData = []; // array to store all results
      for (let pils of pilsData){
        let pilsMerk = String(pils.merk).toLowerCase(); // creates (lowercase) string of current pils merk
        if (pilsMerk.includes(bierMerk)){ // compares user input bierMerk to scraped data pilsMerk
          matchingPilsData.push(pils); // adds current object to array if merk matches
        }
      }
      res.render('aanbiedingen', {pilsDataResponse: matchingPilsData.sort()}); // renders data to ejs file
      db.close();
    });
  });
});


//Create account
router.get('/register', function (req, res) {
  user.findById(req.session.userId)
  .exec(function (error, user) {
    if (error) {
      console.log(error);
    } else {
      if (user === null) {
       res.redirect('/login');
      } else {
        return res.render('register');
      }
    }
  })
});

router.post('/register', function (req, res) {
  if (req.body.username && req.body.password) {
    var userData = {
      username: req.body.username,
      password: req.body.password
    }
    user.create(userData, function (err, user) {
      if (err) {
        console.log(err);
      } else {
        req.session.userId = user._id;
        return res.redirect('/');
      }
    });
  }
})

//Login
router.get('/login', function (req, res) {
  res.render('Login');
})

router.post('/login', function (req, res) {
  if (req.body.username && req.body.password) {
    user.authenticate(req.body.username, req.body.password, function (error, user) {
      if (error || !user) {
        res.send("Incorrect username or password");
      } else {
        console.log(2);
        req.session.userId = user._id;
        return res.redirect('/');
      }
    });
  } else {
    console.log("Missing fields");
  }
})




module.exports = router;
