const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')

const userSchema = mongoose.Schema({
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
    required: true,
    minLength: 7
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

// userSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
//   const user = this._update.$set
//   if (user.password) {
//     bcrypt.hash(user.password, 10, function (err, hash) {
//       if (err) {
//         return next(err)
//       }
//       user.password = hash
//       next()
//     })
//   } else {
//     next()
//   }
// })

// userSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
//   const user = this._update.$set
//   if (user.isModified('password')) {
//     user.password = await bcrypt.hash(user.password, 10)
//   }
//   next()
// })

userSchema.pre('save', async function (next) {
  // Hash the password before saving the user model
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10)
  }
  next()
})

userSchema.methods.generateAuthToken = async function () {
  // Generate an auth token for the user
  const user = this
  const token = jwt.sign({ _id: user._id }, process.env.JWTSECRET, { expiresIn: '15m' })
  return token
}

userSchema.statics.findByUserId = async (_id) => {
  const user = await User.findOne({ _id })
  if (!user) {
    throw new Error({ error: 'No user found' })
  }
  return user
}

userSchema.statics.findByCredentials = async (username, password) => {
  const user = await User.findOne({ username })
  if (!user) {
    throw new Error({ error: 'Invalid login credentials' })
  }
  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    throw new Error({ error: 'Invalid login credentials' })
  }
  return user
}

const User = mongoose.model('User', userSchema)

module.exports = User
