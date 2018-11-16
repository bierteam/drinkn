const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const router = express.Router()
const user = require('../models/user')
const beer = require('../models/beer')
const counter = require('../models/counter')
const dbImport = require('./dbImport')
const requiresLogin = require('./requiresLogin')
let stores, batch

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

router.get('/', requiresLogin, function (req, res) {
  res.render('home')
})

router.post('/', requiresLogin, function (req, res) {
  res.render('home')
})

// router.get('/aanbiedingen', requiresLogin, function (req, res) {
//   counter.findOne({}).exec(function (err, result) {
//     batch = result.counter
//     if (err) throw err
//   })
//   const storeQuery = beer.find({}).distinct('store')
//   storeQuery.exec(function (err, result) {
//     stores = result
//     if (err) throw err
//     res.render('aanbiedingen', { storeDataResponse: stores, pilsDataResponse: '' })
//   })
// })

router.get('/aanbiedingen', requiresLogin, function (req, res) {
  const brand = req.query.brand
  const store = req.query.store
  const volume = req.query.volume
  counter.findOne({}).exec(function (err, result) {
    batch = result.counter
    if (err) throw err
  })
  const storeQuery = beer.find({}).distinct('store')
  storeQuery.exec(function (err, result) {
    stores = result
    if (err) throw err
  })
  let query
  let parameters
  console.log(`User input is: ${brand || 'empty'}`)
  console.log(`Selected store: ${store || 'empty'}`)
  console.log(`Selected volume: ${volume || 'empty'}`)
  if (brand && store && volume) {
    parameters = { batch, 'brand': { $regex: `.*${brand}.*`, '$options': 'i' }, store, 'volume': { $regex: `.*${volume}.*`, '$options': 'i' } }
  } else if (brand && store) {
    parameters = { batch, 'brand': { $regex: `.*${brand}.*`, '$options': 'i' }, store }
  } else if (brand && volume) {
    parameters = { batch, 'brand': { $regex: `.*${brand}.*`, '$options': 'i' }, 'volume': { $regex: `.*${volume}.*`, '$options': 'i' } }
  } else if (store && volume) {
    parameters = { batch, 'volume': { $regex: `.*${volume}.*`, '$options': 'i' }, store }
  } else if (brand) {
    parameters = { batch, 'brand': { $regex: `.*${brand}.*`, '$options': 'i' } }
  } else if (store) {
    parameters = { batch, store }
  } else if (volume) {
    parameters = { batch, 'volume': { $regex: `.*${volume}.*`, '$options': 'i' } }
  } else {
    parameters = { batch }
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
  res.render('login')
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
