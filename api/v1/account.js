const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAuthenticated = require('../../services/isAuthenticated')
const writeLog = require('../../services/writeLog')
const context = 'Account'

router.get('/', isAuthenticated, function (req, res) {
  const _id = req.session.userId
  user.findOne({ _id }).select('username').exec(function (err, results) {
    if (err) console.error(err)
    res.json(results)
  })
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
  user.findOneAndUpdate({ _id }, { $set: parameters }, { strict: false, new: true })
    .select('username admin')
    .exec(function (err, result) {
      if (err) {
        writeLog(err, 'Error', context)
        res.sendStatus(500)
      } else {
        writeLog(`${req.session.userId} updated their account.`, 'Info', context)
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
      writeLog(`User ${req.session.userId} deleted their account.`, 'Info', context)
    }
  })
})

module.exports = router
