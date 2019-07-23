const express = require('express')
const router = express.Router()
const store = require('../../models/store')
const dbImport = require('../../services/dbImport')
const isAuthenticated = require('../../services/isAuthenticated')
const aanbieding = require('./aanbieding')

const users = require('./users')
const logging = require('./logging')
router.use('/users', users)
router.use('/logging', logging)
router.use(aanbieding)

router.get('/stores', isAuthenticated, function (req, res) {
  store.findOne({}).exec(function (err, result) {
    if (err) console.error(err)
    res.json(result)
  })
})

// DEBUG { $set: req.body.newStores }
// DEBUG { $set: {"test" : "test"} }
router.post('/stores', isAuthenticated, function (req, res) {
  store.findOneAndUpdate({}, { $set: req.body.newStores }, { strict: false, new: true }, function (err, result) {
    if (err) console.error(err)
    res.json(result)
  })
})

router.delete('/stores', isAuthenticated, function (req, res) { // WIP
  console.log(req.body)
  store.updateOne({}, { $unset: req.body.remove }, { strict: false }, function (err, result) {
    if (err) console.error(err)
    res.json(result.ok)
  })
})

router.post('/import', isAuthenticated, function (req, res) {
  dbImport()
  res.json('received')
})

module.exports = router
