const express = require('express')
require('../models/user')
const Token = require('../models/token')
const auth = require('../middleware/auth')
const router = express.Router()

router.delete('/', auth, async (req, res) => {
  // Log user out of the application
  try {
    await Token.findOneAndDelete({ userId: req.user._id })
    res
      .clearCookie('refreshToken')
      .send()
  } catch (error) {
    res.status(500).send()
  }
})

router.delete('/all', auth, async (req, res) => {
  // Log user out of all devices
  try {
    await Token.deleteMany({ userId: req.user._id })
    res
      .clearCookie('refreshToken')
      .send()
  } catch (error) {
    res.status(500).send()
  }
})

module.exports = router
