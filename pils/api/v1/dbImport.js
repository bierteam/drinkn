const express = require('express')
const router = express.Router()
const isAdmin = require('../../services/isAdmin')
const dbImport = require('../../services/dbImport')
const writeLog = require('../../services/writeLog')
const context = 'Import'

router.post('/import', isAdmin, function (req, res) {
  dbImport()
  writeLog(`Manual import initiated by ${req.session.username}: ${req.session.userId}`, 'Info', context, req.realIp)
  res.json('received')
})

module.exports = router
