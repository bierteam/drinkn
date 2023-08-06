const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAuthenticated = require('../../services/isAuthenticated')
const otp = require('../../services/otp')
const writeLog = require('../../services/writeLog')
const context = 'Account'

router.get('/', isAuthenticated, async function (req, res) {
  try {
    const _id = req.session.userId
    const results = await user.findOne({ _id }).select('username otp.status').exec()

    writeLog(`${req.session.username}: ${req.session.userId} requested account data`, 'Info', context, req.realIp)

    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/otp', isAuthenticated, function (req, res) {
  const result = otp.generate(req)
  writeLog(`${req.session.username}: ${req.session.userId} requested otp secret`, 'Info', context, req.realIp)
  res.json(result)
})

router.post('/', isAuthenticated, async function (req, res) {
  try {
    const _id = req.session.userId
    const parameters = {}
    parameters.editedBy = { _id: req.session.userId, username: req.session.username }

    if (!req.body.user.oldPassword) {
      return res.status(401).send('You need to fill in your old password.')
    }
    // TODO: Implement authentication using the old password here.

    if (req.body.user.otp && req.session.secret) {
      if (!otp.check(req.body.user.otp, req.session.secret)) {
        return res.status(401).send('The 2FA code is only valid for 30 seconds, try again.')
      }
      parameters.otp = { status: true, secret: req.session.secret }
      delete req.session.secret
    }

    const result = await user.findOneAndUpdate({ _id }, { $set: parameters }, { strict: false, new: true })
      .select('username admin otp.status')
      .exec()

    writeLog(`${req.session.username}: ${req.session.userId} updated their account.`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.sendStatus(500)
  }
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
      writeLog(`User ${req.session.username}: ${req.session.userId} deleted their account.`, 'Info', context, req.realIp)
    }
  })
})

module.exports = router
