const User = require('../models/user')
const Token = require('../models/token')

const generateByRefresh = async function (refreshToken) {
  const token = await Token.validateRefreshToken(refreshToken)
  const user = await User.findByUserId(token.userId)
  const result = await this.generateByUser(user)
  return result
}

const generateByUser = async function (user) {
  const result = {
    auth: await user.generateAuthToken(),
    refresh: await new Token({ userId: user._id })
  }
  result.refresh.save()
  return result
}

module.exports = { generateByRefresh, generateByUser }
