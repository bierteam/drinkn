const express = require('express')
const User = require('../models/user')
const router = express.Router()

router.post('/', async (req, res) => {
  // Create a new user
  try {
    const user = new User(req.body)
    await user.save()
    const token = await user.generateAuthToken()
    const refreshToken = await user.generateRefreshToken()
    res.status(201).send({ token, refreshToken })
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router
