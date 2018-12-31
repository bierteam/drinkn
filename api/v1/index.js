const express = require('express')
const router = express.Router()
const beer = require('../../models/beer')
const store = require('../../models/store')
const counter = require('../../models/counter')
const dbImport = require('../../methods/dbImport')

let counterQuery = counter.findOne({})
let counterExec = counterQuery.exec()

router.get('/aanbiedingen', function (req, res) {
  counterExec.then(function (result) {
    let batch = result.counter
    let query = beer.find({ batch }) // .limit(5) // limit on 5 for testing purposes
    query.exec(function (err, results) {
      if (err) throw err
      res.json(results)
    })
  })
})

// Example on how to get data for specific store
router.get('/aanbiedingen:store', function (req, res) {
  counterExec.then(function (result) {
    let store = req.params.store
    let batch = result.counter
    let query = beer.find({ batch, store }) // .limit(5) // limit on 5 for testing purposes
    query.exec(function (err, results) {
      if (err) throw err
      res.json(results)
    })
  })
})

router.get('/stores', function (req, res) {
  store.findOne({}).exec(function (err, result) {
    batch = result.counter
    if (err) throw err
    res.json(result)
  })
})

router.post('/import', function (req, res) {
  dbImport()
  res.json('received')
})

module.exports = router
