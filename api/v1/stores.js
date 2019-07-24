const express = require('express')
const router = express.Router()
const isAuthenticated = require('../../services/isAuthenticated')
const store = require('../../models/store')

router.get('/stores', isAuthenticated, function (req, res) {
  store.findOne({}).exec(function (err, result) {
    if (err) console.error(err)
    res.json(result)
  })
})

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

module.exports = router
