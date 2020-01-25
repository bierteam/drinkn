const express = require('express')
const router = express.Router()

// This tells the client their login status

router.get('/', function (req, res) {
  if (req.session.userId) {
    res.send(true)
  } else {
    res.send(false)
  }
})

module.exports = router
