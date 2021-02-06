const express = require('express')
const User = require('../models/user')
const Auth = require('../methods/tokens')

const router = express.Router()

router.post('/', async (req, res) => {
  // Create a new user
  try {
    const user = new User(req.body)
    await user.save()
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
    res.status(400).send(error)
  }
})

module.exports = router
