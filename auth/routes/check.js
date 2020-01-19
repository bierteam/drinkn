const express = require('express')
const router = express.Router()

// This tells the client login status

router.get('/', function (req, res) {
  res.send('test')
})

module.exports = router
