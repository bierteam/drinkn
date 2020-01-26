const express = require('express')
const router = express.Router()

router.get('/', function (req, res) {
  // TODO check for healthy database connection
  res.sendStatus(200)
})

module.exports = router
