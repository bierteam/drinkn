const express = require('express')
const router = express.Router()
const isAuthenticated = require('../../services/isAuthenticated')
const discount = require('../../services/discount')
const writeLog = require('../../services/writeLog')
const context = 'Discount'

router.get('/discounts', isAuthenticated, async function (req, res) {
  const resp = await discount()
  writeLog(`${req.session.username}: ${req.session.userId} requested discount data`, 'Info', context, req.ip)
  res.json(resp)
})

module.exports = router
