const User = require('../models/user')
const Token = require('../models/token')

const generateByRefresh = async function (refreshToken) {
  const result = {}
  const token = await Token.validateRefreshToken(refreshToken)
  const user = await User.findByUserId(token.userId)
  result.auth = await user.generateAuthToken()
  result.refresh = await new Token({ userId: token.userId })
  result.refresh.save()

  return result
}
const generateByUser = async function (user) {
  const result = {}
  result.auth = await user.generateAuthToken()
  result.refresh = await new Token({ userId: user._id })
  result.refresh.save()

  return result
}

module.exports = { generateByRefresh, generateByUser }
