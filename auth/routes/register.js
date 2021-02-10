const express = require('express')
const User = require('../models/user')
const Auth = require('../methods/tokens')

const router = express.Router()

router.post('/', async (req, res) => {
  // Create a new user
  try {
    const { username, password } = req.body
    const user = new User({ username, password })
    await user.save()
    const tokens = await Auth.generateByUser(user)
    const options = {
      httpOnly: true,
      expires: tokens.refresh.expires
    }
    if (process.env.NODE_ENV === 'production') options.secure = true
    res
      .cookie('refreshToken', tokens.refresh.id, options)
      .status(200)
      .send({ jwt: tokens.auth })
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router
