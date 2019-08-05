const express = require('express')
const router = express.Router()
const isAuthenticated = require('../../services/isAuthenticated')
const discount = require('../../services/discount')

router.get('/discounts', isAuthenticated, async function (req, res) {
  const resp = await discount()
  res.json(resp)
})

module.exports = router
