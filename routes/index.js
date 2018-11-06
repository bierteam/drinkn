const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const router = express.Router()
const user = require('../models/user')
const dbImport = require('./dbImport')
const requiresLogin = require('./requiresLogin')
const beer = require('../models/beer')
let stores

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
    stores = result
    if (err) throw err
    res.render('aanbiedingen', { storeDataResponse: stores, pilsDataResponse: '' })
  })
})

router.post('/aanbiedingen', requiresLogin, function (req, res) {
  let beerBrand = req.body.merk
  let beerStore = req.body.store
  let beerVolume = req.body.volume
  let query
  let parameters
  console.log(`User input is: ${beerBrand || 'empty'}`)
  console.log(`Selected store: ${beerStore || 'empty'}`)
  console.log(`Selected volume: ${beerVolume || 'empty'}`)
  if (beerBrand && beerStore && beerVolume) {
    parameters = { 'brand': { $regex: `.*${beerBrand}.*`, '$options': 'i' }, 'store': `${beerStore}`, 'volume': { $regex: `.*${beerVolume}.*`, '$options': 'i' } }
  } else if (beerBrand && beerStore) {
    parameters = { 'brand': { $regex: `.*${beerBrand}.*`, '$options': 'i' }, 'store': `${beerStore}` }
  } else if (beerBrand && beerVolume) {
    parameters = { 'brand': { $regex: `.*${beerBrand}.*`, '$options': 'i' }, 'volume': { $regex: `.*${beerVolume}.*`, '$options': 'i' } }
  } else if (beerStore && beerVolume) {
    parameters = { 'volume': { $regex: `.*${beerVolume}.*`, '$options': 'i' }, 'store': `${beerStore}` }
  } else if (beerBrand) {
    parameters = { 'brand': { $regex: `.*${beerBrand}.*`, '$options': 'i' } }
  } else if (beerStore) {
    parameters = { 'store': `${beerStore}` }
  } else if (beerVolume) {
    parameters = { 'volume': { $regex: `.*${beerVolume}.*`, '$options': 'i' } }
  } else {
    parameters = {}
  }
  query = beer.find(parameters).limit(100)
  query.exec(function (err, results) {
    if (err) throw err
    res.render('aanbiedingen', { storeDataResponse: stores, pilsDataResponse: results })
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
