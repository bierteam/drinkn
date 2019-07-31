const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAdmin = require('../../services/isAdmin')

const writeLog = require('../../services/writeLog')
const context = 'Login'

router.get('/', isAdmin, function (req, res) {
  user.find({}).select('username').exec(function (err, results) {
    if (err) console.error(err)
    res.json(results)
  })
})

router.post('/login', function (req, res) {
  if (req.body.email && req.body.password) {
    user.authenticate(req.body.email, req.body.password, function (error, user) {
      if (error || !user) {
        res.status(403).send('Incorrect username or password')
      } else {
        writeLog(`User ${req.body.email} has logged in.`, 'Info', context)
        if (!req.body.remember) {
          req.session.cookie.expires = false
        }
        req.session.userId = user._id
        req.session.admin = user.admin
        res.sendStatus(200)
      }
    })
  } else {
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
  if (req.body.email && req.body.password) {
    let userData = {
      username: req.body.email,
      password: req.body.password
    }
    user.create(userData, function (err, user) {
      if (err) {
        writeLog(err, 'Error', context)
        res.status(200).send('Something went wrong, maybe the user already exists...')
      } else {
        writeLog(`User account ${userData.username} has been created by ${req.session.userId}`, 'Info', context)
        res.sendStatus(201)
      }
    })
  }
})

module.exports = router
