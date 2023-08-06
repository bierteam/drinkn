const express = require('express')
const router = express.Router()
const isAdmin = require('../../services/isAdmin')
const store = require('../../models/store')
const writeLog = require('../../services/writeLog')
const context = 'Store'

router.get('/stores', isAdmin, async function (req, res) {
  try {
    const result = await store.findOne({}).exec()
    writeLog(`${req.session.username}: ${req.session.userId} requested store data`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/stores', isAdmin, async function (req, res) {
  try {
    const result = await store.findOneAndUpdate({}, { $set: req.body.newStores }, { strict: false, new: true }).exec()
    writeLog(`${req.session.username}: ${req.session.userId} updated store data`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/stores', isAdmin, async function (req, res) {
  try {
    console.log(req.body)
    const result = await store.updateOne({}, { $unset: req.body.remove }, { strict: false }).exec()
    writeLog(`${req.session.username}: ${req.session.userId} deleted store data`, 'Info', context, req.realIp)
    res.json(result.ok)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
