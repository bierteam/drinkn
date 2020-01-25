const express = require('express')
const User = require('../models/user')
const otp = require('../methods/otp')
const router = express.Router()

router.post('/login', async (req, res) => {
  // Login a registered user
  try {
    const { email, password } = req.body
    const user = await User.findByCredentials(email, password)
    if (!user) {
      // TODO log the failed attempt here
      return res.status(401).send({ error: 'Login failed! Check credentials' })
    } else if (user.otp && user.otp.status && !req.body.token) {
      // TODO log here that 2fa is required
      return res.json({ otp: true })
    } else if (user.otp && user.otp.status && !otp.check(req.body.token, user.otp.secret)) {
      return res.status(401).send('The 2FA code is only valid for 30 seconds, try again.')
    }
    // TODO log here that the user succeeded
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router
