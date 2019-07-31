const express = require('express')
const router = express.Router()
const isAdmin = require('../../services/isAdmin')
const dbImport = require('../../services/dbImport')

router.post('/import', isAdmin, function (req, res) {
  dbImport()
  res.json('received')
})

module.exports = router
