const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const SALT_ROUNDS = 10

const CredentialSchema = new mongoose.Schema({
  credentialID: {
    type: String,
    required: true,
    index: true
  },
  publicKey: {
    type: String,
    required: true
  },
  counter: {
    type: Number,
    required: true,
    default: 0
  },
  transports: {
    type: [String],
    default: []
  },
  name: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

// the issuer's own handle on the account. The subject is the stable half:
// a username can be renamed upstream, a subject cannot
const FederatedSchema = new mongoose.Schema({
  issuer: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  linkedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

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
    // a federated account signs in at the issuer, so it holds no password
    required: function () {
      return !this.oidc?.subject
    }
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
  credentials: {
    type: [CredentialSchema],
    default: []
  },
  oidc: {
    type: FederatedSchema,
    required: false
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

    // a federated account has no password to compare against, and must not
    // fall through to bcrypt with an undefined hash
    if (!user.password) return callback()

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

// mongoose 9 no longer passes `next` to async middleware: returning/throwing
// is the signal, so taking a `next` argument here would blow up with
// "next is not a function"
UserSchema.pre('save', async function () {
  // a federated account is created without one
  if (!this.password) return
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
})

UserSchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
  const user = this._update.$set || {}
  if (user.password) {
    user.password = await bcrypt.hash(user.password, SALT_ROUNDS)
  }
})

const User = mongoose.model('User', UserSchema)
module.exports = User
