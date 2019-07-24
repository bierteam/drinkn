const express = require('express')
const router = express.Router()
const isAuthenticated = require('../../services/isAuthenticated')
const dbImport = require('../../services/dbImport')

router.post('/import', isAuthenticated, function (req, res) {
  dbImport()
  res.json('received')
})

module.exports = router
