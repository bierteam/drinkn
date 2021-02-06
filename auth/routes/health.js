const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

router.get('/', function (req, res) {
  if (mongoose.connection.readyState) {
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
})

module.exports = router
