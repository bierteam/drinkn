const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const SALT_ROUNDS = 10

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  admin: {
    type: Boolean,
    required: true,
    default: false
  },
  createdBy: {
    type: Object,
    required: false,
    _id: {
      required: true
    },
    username: {
      required: true
    }
  },
  editedBy: {
    type: Object,
    required: false,
    _id: {
      required: true
    },
    username: {
      required: true
    }
  },
  otp: {
    type: Object,
    required: false,
    status: {
      type: Boolean,
      required: true,
      default: false
    },
    secret: {
      type: String,
      required: false
    }
  }
})

UserSchema.statics.authenticate = async function (username, password, callback) {
  try {
    const user = await User.findOne({ username }).exec()

    if (!user) {
      const err = new Error('User not found.')
      err.status = 401
      throw err
    }

    const result = await bcrypt.compare(password, user.password)
    if (result === true) {
      return callback(null, user)
    } else {
      return callback()
    }
  } catch (err) {
    console.error(err)
    return callback()
  }
}

UserSchema.pre('save', async function (next) {
  try {
    const user = this
    const hash = await bcrypt.hash(user.password, SALT_ROUNDS)
    user.password = hash
    next()
  } catch (err) {
    next(err)
  }
})

UserSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
  try {
    const user = this._update.$set
    if (user.password) {
      const hash = await bcrypt.hash(user.password, SALT_ROUNDS)
      user.password = hash
    }
    next()
  } catch (err) {
    next(err)
  }
})

const User = mongoose.model('User', UserSchema)
module.exports = User
