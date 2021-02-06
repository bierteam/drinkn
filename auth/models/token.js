const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const tokenSchema = mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    required: true,
    type: String
  },
  expires: {
    required: true,
    type: Date,
    default: () => Date.now() + 24 * 60 * 60 * 1000,
    index: {
      expires: '1s'
    }
  }
})

tokenSchema.statics.validateRefreshToken = async function (refreshToken) {
  const token = await Token.findOneAndDelete({ _id: refreshToken })
  if (token) {
    return token
  } else {
    throw new Error({ error: 'Invalid token' })
  }
}

const Token = mongoose.model('Token', tokenSchema)

module.exports = Token
