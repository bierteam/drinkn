const express = require('express')
const router = express.Router()
const isAuthenticated = require('../../services/isAuthenticated')
const aanbieding = require('../../services/aanbieding')

router.get('/aanbiedingen', isAuthenticated, async function (req, res) {
  const resp = await aanbieding()
  res.json(resp)
})

module.exports = router
