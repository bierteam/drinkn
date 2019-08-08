const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAdmin = require('../../services/isAdmin')
const otp = require('../../services/otp')
const writeLog = require('../../services/writeLog')
const context = 'Users'

router.post('/login', function (req, res) {
  if (req.body.username && req.body.password) {
    user.authenticate(req.body.username, req.body.password, function (error, user) {
      if (error || !user) {
        writeLog(`Failed login attempt for user: ${req.body.username}`, 'Warning', context, req.ip)
        res.status(401).send('Incorrect username or password')
      } else if (user.otp && user.otp.status && !req.body.token) {
        writeLog(`User ${user.username}: ${user._id} requires a 2fa token.`, 'Info', context, req.ip)
        return res.json({ otp: true })
      } else {
        if (user.otp && user.otp.status && !otp.check(req.body.token, user.otp.secret)) {
          return res.status(401).send('The 2FA code is only valid for 30 seconds, try again.')
        }
        writeLog(`User ${user.username}: ${user._id} has logged in.`, 'Info', context, req.ip)
        if (!req.body.remember) {
          req.session.cookie.expires = false
        }
        req.session.userId = user._id
        req.session.admin = user.admin
        req.session.username = user.username
        res.status(200).send({ admin: user.admin, _id: user._id })
      }
    })
  } else {
    writeLog(`Login try with missing fields`, 'Warning', context, req.ip)
    res.status(403).send('Missing fields')
  }
})

router.delete('/logout', function (req, res, next) {
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        res.sendStatus(500)
        writeLog(err, 'Error', context)
      } else {
        res.clearCookie('connect.sid', { path: '/' }).status(200).send('Cookie deleted.')
      }
    })
  }
})

router.post('/register', isAdmin, function (req, res) {
  if (req.body.username && req.body.password) {
    const userData = {
      username: req.body.username,
      password: req.body.password,
      admin: req.body.admin,
      createdBy: { _id: req.session.userId, username: req.session.username }
    }
    user.create(userData, function (err, user) {
      if (err) {
        writeLog(err, 'Error', context)
        res.status(200).send('Something went wrong, maybe the user already exists...')
      } else {
        writeLog(`User account ${userData.username} has been created by ${req.session.username}: ${req.session.userId}`, 'Info', context, req.ip)
        res.sendStatus(201)
      }
    })
  }
})

router.get('/', isAdmin, function (req, res) {
  user.find().select('username admin').exec(function (err, results) {
    if (err) console.error(err)
    writeLog(`${req.session.username}: ${req.session.userId} requested users data`, 'Info', context, req.ip)
    res.json(results)
  })
})

router.get('/:_id', isAdmin, function (req, res) {
  const _id = { _id: req.params._id }
  user.findOne(_id).select('username admin createdBy editedBy otp.status').exec(function (err, result) {
    if (err) console.error(err)
    writeLog(`${req.session.username}: ${req.session.userId} requested ${req.params._id}`, 'Info', context, req.ip)
    res.json(result)
  })
})

router.post('/:_id', isAdmin, function (req, res) {
  const _id = req.params._id
  const parameters = {}
  parameters.editedBy = { _id: req.session.userId, username: req.session.username }
  if (req.body.user.password) {
    parameters.password = req.body.user.password
  }
  if (req.body.user.username) {
    parameters.username = req.body.user.username
  }
  if (req.body.user.admin != null) {
    parameters.admin = req.body.user.admin
  }
  user.findOneAndUpdate({ _id }, { $set: parameters }, { strict: false, new: true })
    .select('username admin')
    .exec(function (err, result) {
      if (err) {
        writeLog(err, 'Error', context)
        res.sendStatus(500)
      } else {
        writeLog(`${req.session.username}: ${req.session.userId} updated ${result}`, 'Info', context, req.ip)
        res.json(result)
      }
    })
})

router.delete('/:_id', isAdmin, function (req, res) {
  user.deleteOne({ _id: req.params._id }, function (err) {
    if (err) {
      console.err(err)
      writeLog(err, 'Error', context)
      res.sendStatus(500)
    } else {
      res.sendStatus(200)
      writeLog(`${req.session.username}: ${req.session.userId} deleted user ${req.params._id}`, 'Warning', context, req.ip)
    }
  })
})

module.exports = router
