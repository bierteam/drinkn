const express = require('express')
const User = require('../models/user')
const Auth = require('../methods/tokens')

const router = express.Router()

router.post('/', async (req, res) => {
  // Login a registered user
  try {
    const { username, password, otp } = req.body
    const user = await User.findByCredentials(username, password)
    if (!user) {
      // TODO log the failed attempt here
      return res.status(401).send({ error: 'Login failed! Check credentials' })
    } else if (user.otp && user.otp.status && !otp) {
      // TODO log here that 2fa is required
      return res.json({ otp: true })
    } else if (user.otp && user.otp.status && !otp.check(otp, user.otp.secret)) {
      return res.status(401).send('The 2FA code is only valid for 30 seconds, try again.')
    }
    // TODO log here that the user succeeded
    const tokens = await Auth.generateByUser(user)
    const jwt = tokens.auth
    const options = {
      httpOnly: true,
      expires: tokens.refresh.expires
    }
    if (process.env.NODE_ENV === 'production') options.secure = true
    res
      .cookie('refreshToken', tokens.refresh.id, options)
      .status(200)
      .send({ jwt })
  } catch (error) {
    res.status(401).send()
    console.error(error)
  }
})

module.exports = router
