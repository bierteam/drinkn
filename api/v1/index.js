const express = require('express')
const router = express.Router()
const beer = require('../../models/beer')
const store = require('../../models/store')
const cron = require('node-cron')
const script = require('../../methods/dbImport')
const isAuthenticated = require('../../methods/isAuthenticated')

const users = require('./users')
const logging = require('./logging')
router.use('/users', users)
router.use('/logging', logging)

let aanbiedingen
const query = () => {
  beer.find({ validity: { $gte: Date() } }).exec(function (err, result) {
    if (err) console.error(err)
    aanbiedingen = result
  })
}
query()

const dbImport = async () => {
  await script()
  query()
}
cron.schedule('0 9,22 * * *', async () => {
  const timeout = Math.round(Math.random() * 60) * 1000 * 1000
  setTimeout(await dbImport, timeout)
  console.log('Cron: running import in: ' + (timeout / 1000000) + ' minutes.')
})

router.get('/aanbiedingen', isAuthenticated, function (req, res) {
  res.json(aanbiedingen)
})

// Example on how to get data for specific store
router.get('/aanbiedingen:store', isAuthenticated, function (req, res) {
  let store = req.params.store
  let query = beer.find({ store })
  query.exec(function (err, results) {
    if (err) throw err
    res.json(results)
  })
})

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

router.post('/query', isAuthenticated, function (req, res) { // this is a temporary fix
  query()
  console.log('Refreshing')
  res.json('received')
})

module.exports = router
