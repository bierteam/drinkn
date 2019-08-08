const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAuthenticated = require('../../services/isAuthenticated')
const otp = require('../../services/otp')
const writeLog = require('../../services/writeLog')
const context = 'Account'

router.get('/', isAuthenticated, function (req, res) {
  const _id = req.session.userId
  user.findOne({ _id }).select('username').exec(function (err, results) {
    if (err) console.error(err)
    writeLog(`${req.session.username}: ${req.session.userId} requested account data`, 'Info', context, req.ip)
    res.json(results)
  })
})

router.get('/otp', isAuthenticated, function (req, res) {
  const result = otp.generate(req)
  writeLog(`${req.session.username}: ${req.session.userId} requested otp secret`, 'Info', context, req.ip)
  res.json(result)
})

router.post('/', isAuthenticated, function (req, res) {
  const _id = req.session.userId
  const parameters = {}
  parameters.editedBy = req.session.userId
  if (req.body.user.password) {
    parameters.password = req.body.user.password
  }
  if (req.body.user.username) {
    parameters.username = req.body.user.username
  }
  if (req.body.user.oldPassword) {
    // TODO check old password
  } else return res.status(401).send('You need to fill in your old password.')

  if (req.body.user.otp && req.session.secret) {
    if (!otp.check(req)) return res.status(401).send('The 2FA code is only valid for 30 seconds, try again.')
    parameters.otp = { status: true, secret: req.session.secret }
    delete req.session.secret
  }
  user.findOneAndUpdate({ _id }, { $set: parameters }, { strict: false, new: true })
    .select('username admin')
    .exec(function (err, result) {
      if (err) {
        writeLog(err, 'Error', context)
        res.sendStatus(500)
      } else {
        writeLog(`${req.session.username}: ${req.session.userId} updated their account.`, 'Info', context, req.ip)
        res.json(result)
      }
    })
})

router.delete('/delete', isAuthenticated, function (req, res, next) {
  const _id = req.session.userId
  user.deleteOne({ _id }, function (err) {
    if (err) {
      console.err(err)
      writeLog(err, 'Error', context)
      res.sendStatus(500)
    } else {
      res.clearCookie('connect.sid', { path: '/' }).status(200).send('Account deleted, removing cookie...')
      writeLog(`User ${req.session.username}: ${req.session.userId} deleted their account.`, 'Info', context, req.ip)
    }
  })
})

module.exports = router
