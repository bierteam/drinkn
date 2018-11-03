const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const router = express.Router()
const user = require('../models/user')
const dbImport = require('./dbImport')
const requiresLogin = require('./requiresLogin')
const beer = require('../models/beer')
// const getStores = require('./stores')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

router.get('/', requiresLogin, function (req, res) {
  res.render('home')
})

router.post('/', requiresLogin, function (req, res) {
  res.render('home')
})

router.get('/aanbiedingen', requiresLogin, function (req, res) {
  const storeQuery = beer.find({}).distinct('store')
  storeQuery.exec(function (err, result) {
    if (err) throw err
    res.render('aanbiedingen', { storeDataResponse: result, pilsDataResponse: '' })
  })
})

router.post('/aanbiedingen', requiresLogin, function (req, res) {
  let bierMerk = req.body.merk
  let beerStore = req.body.store
  bierMerk = bierMerk.toLowerCase()
  console.log(beerStore)
  let query
  console.log(`The current user input is ${bierMerk}`)
  console.log(`The current store ${beerStore}`)
  if (bierMerk && beerStore) {
    query = beer.find({ 'brand': { $regex: `.*hei.*`, '$options': 'i' }, 'store': `${beerStore}` })
  } else if (req.body.merk) {
    query = beer.find({ 'brand': { $regex: `.*${bierMerk}.*`, '$options': 'i' } })
  } else if (req.body.store) {
    query = beer.find({ 'store': `${beerStore}` })
  }
  query.exec(function (err, results) {
    if (err) throw err
    res.render('aanbiedingen', { storeDataResponse: '', pilsDataResponse: results })
  })
})

router.get('/register', requiresLogin, function (req, res) {
  res.render('register')
})

router.post('/register', requiresLogin, function (req, res) {
  if (req.body.username && req.body.password) {
    let userData = {
      username: req.body.username,
      password: req.body.password
    }
    user.create(userData, function (err, user) {
      if (err) {
        console.error(err)
      } else {
        console.log(`User account ${userData.username} has been created`)
        return res.redirect('/')
      }
    })
  }
})

router.get('/login', function (req, res) {
  res.render('Login')
})

router.post('/login', function (req, res) {
  if (req.body.username && req.body.password) {
    user.authenticate(req.body.username, req.body.password, function (error, user) {
      if (error || !user) {
        res.send('Incorrect username or password')
      } else {
        console.log(`User ${req.body.username} has logged in.`)
        req.session.userId = user._id
        return res.redirect('/')
      }
    })
  } else {
    console.log('Missing fields')
  }
})

router.get('/import', requiresLogin, function (req, res) {
  res.render('import')
})

router.post('/import', requiresLogin, function (req, res) {
  dbImport()
  res.redirect('/')
})

router.get('/logout', requiresLogin, function (req, res, next) {
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        console.error(err)
      } else {
        return res.redirect('/login')
      }
    })
  }
})

module.exports = router
