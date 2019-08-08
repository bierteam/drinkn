const express = require('express')
const router = express.Router()
const isAdmin = require('../../services/isAdmin')
const store = require('../../models/store')
const writeLog = require('../../services/writeLog')
const context = 'Store'

router.get('/stores', isAdmin, function (req, res) {
  store.findOne({}).exec(function (err, result) {
    if (err) console.error(err)
    writeLog(`${req.session.username}: ${req.session.userId} requested store data`, 'Info', context, req.realIp)
    res.json(result)
  })
})

router.post('/stores', isAdmin, function (req, res) {
  store.findOneAndUpdate({}, { $set: req.body.newStores }, { strict: false, new: true }, function (err, result) {
    if (err) console.error(err)
    writeLog(`${req.session.username}: ${req.session.userId} updated store data`, 'Info', context, req.realIp)
    res.json(result)
  })
})

router.delete('/stores', isAdmin, function (req, res) { // WIP
  console.log(req.body)
  store.updateOne({}, { $unset: req.body.remove }, { strict: false }, function (err, result) {
    if (err) console.error(err)
    writeLog(`${req.session.username}: ${req.session.userId} deleted store data`, 'Info', context, req.realIp)
    res.json(result.ok)
  })
})

module.exports = router
