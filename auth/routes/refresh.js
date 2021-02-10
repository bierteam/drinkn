const express = require('express')
const Token = require('../methods/tokens')

const router = express.Router()

router.get('/', async (req, res) => {
  const refreshToken = req.cookies.refreshToken
  try {
    if (refreshToken) {
      const tokens = await Token.generateByRefresh(refreshToken)
      const options = {
        httpOnly: true,
        expires: tokens.refresh.expires
      }
      if (process.env.NODE_ENV === 'production') options.secure = true
      res
        .cookie('refreshToken', tokens.refresh.id, options)
        .status(200)
        .send({ jwt: tokens.auth })
    } else {
      res.status(401).send()
    }
  } catch (error) {
    console.error(error)
    return res.status(401).send()
  }
})

module.exports = router
