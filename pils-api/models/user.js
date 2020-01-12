const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const uuid = require('uuid/v4')

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuid
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

UserSchema.statics.authenticate = function (username, password, callback) {
  User.findOne({ username: username })
    .exec(function (err, user) {
      if (err) {
        return callback(err)
      } else if (!user) {
        const err = new Error('User not found.')
        err.status = 401
        return callback(err)
      }
      bcrypt.compare(password, user.password, function (err, result) {
        if (err) console.error(err)
        if (result === true) {
          return callback(null, user)
        } else {
          return callback()
        }
      })
    })
}

UserSchema.pre('save', function (next) {
  const user = this
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err)
    }
    user.password = hash
    next()
  })
})

UserSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const user = this._update.$set
  if (user.password) {
    bcrypt.hash(user.password, 10, function (err, hash) {
      if (err) {
        return next(err)
      }
      user.password = hash
      next()
    })
  } else {
    next()
  }
})

const User = mongoose.model('User', UserSchema)
module.exports = User
