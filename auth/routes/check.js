const express = require('express')
const auth = require('../middleware/auth')
const router = express.Router()

// This tells the client their login status
router.get('/', auth, async (req, res) => {
  try {
    if (req.user) {
      res.sendStatus(200)
    } else {
      res.sendStatus(401)
    }
  } catch (error) {
    res.status(500).send()
  }
})

module.exports = router
