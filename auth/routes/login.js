const express = require('express')
const User = require('../models/user')
const otp = require('../methods/otp')
const router = express.Router()

router.post('/', async (req, res) => {
  // Login a registered user
  try {
    const { username, password, token } = req.body
    const user = await User.find({ username: username })
    console.log(user)
    if (user == null || user == []) {
      // TODO log the failed attempt here
      return res.status(401).send({ error: 'Login failed! Check credentials' })
    } else if (user.otp && user.otp.status && !token) {
      // TODO log here that 2fa is required
      return res.json({ otp: true })
    } else if (user.otp && user.otp.status && !otp.check(token, user.otp.secret)) {
      return res.status(401).send('The 2FA code is only valid for 30 seconds, try again.')
    }
    // TODO log here that the user succeeded
    res.send('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1ODM5NjU1MTcsImV4cCI6MTYxNTUwMTUxNywiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.rnEWkstkZMDX2BavbHiVSAimULLA5oy80CCSQdNZUxc')
  } catch (error) {
    console.log(error)
    res.status(400).send(error)
  }
})

module.exports = router
