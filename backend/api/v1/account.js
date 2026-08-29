const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAuthenticated = require('../../services/isAuthenticated')
const passkey = require('../../services/passkey')
const writeLog = require('../../services/writeLog')
const context = 'Account'

// never select credentials.publicKey: the account screen only lists the keys,
// and there is no reason to hand the browser the key material
const PASSKEY_FIELDS = 'credentials.credentialID credentials.name credentials.createdAt'

router.get('/', isAuthenticated, async function (req, res) {
  try {
    const _id = req.session.userId
    const results = await user.findOne({ _id }).select(`username ${PASSKEY_FIELDS}`).exec()

    writeLog(`${req.session.username}: ${req.session.userId} requested account data`, 'Info', context, req.realIp)

    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/passkey/options', isAuthenticated, async function (req, res) {
  try {
    const _id = req.session.userId
    const account = await user.findOne({ _id }).select('username credentials').exec()

    if (!account) return res.status(401).send('Thou shall not pass!')

    const options = await passkey.registrationOptions(req, account)
    writeLog(`${req.session.username}: ${req.session.userId} started passkey registration`, 'Info', context, req.realIp)
    res.json(options)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/passkey', isAuthenticated, async function (req, res) {
  let credential
  try {
    credential = await passkey.verifyRegistration(req, req.body.response)
  } catch (error) {
    writeLog(`Failed passkey registration for ${req.session.username}: ${req.session.userId} (${error})`, 'Warning', context, req.realIp)
    return res.status(400).send('That passkey could not be registered, try again.')
  }

  try {
    const _id = req.session.userId
    credential.name = req.body.name ? req.body.name.toString() : 'Passkey'

    const result = await user.findOneAndUpdate(
      { _id },
      { $push: { credentials: credential } },
      { new: true }
    ).select(`username ${PASSKEY_FIELDS}`).exec()

    writeLog(`${req.session.username}: ${req.session.userId} registered a passkey`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/passkey/:credentialID', isAuthenticated, async function (req, res) {
  try {
    const _id = req.session.userId

    const result = await user.findOneAndUpdate(
      { _id },
      { $pull: { credentials: { credentialID: req.params.credentialID } } },
      { new: true }
    ).select(`username ${PASSKEY_FIELDS}`).exec()

    writeLog(`${req.session.username}: ${req.session.userId} removed a passkey`, 'Warning', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', isAuthenticated, async function (req, res) {
  try {
    const _id = req.session.userId
    const parameters = {}
    parameters.editedBy = { _id: req.session.userId, username: req.session.username }

    if (req.body.user.password) {
      parameters.password = req.body.user.password
    }
    if (req.body.user.username) {
      parameters.username = req.body.user.username
    }

    // the old-password field was the only thing standing between an empty
    // body and a write that only stamped editedBy
    if (!parameters.password && !parameters.username) {
      return res.status(400).send('Nothing to change.')
    }

    const result = await user.findOneAndUpdate({ _id }, { $set: parameters }, { strict: false, new: true })
      .select(`username admin ${PASSKEY_FIELDS}`)
      .exec()

    writeLog(`${req.session.username}: ${req.session.userId} updated their account.`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.sendStatus(500)
  }
})

router.delete('/delete', isAuthenticated, async function (req, res) {
  try {
    const _id = req.session.userId

    await user.deleteOne({ _id })

    res.clearCookie('connect.sid', { path: '/' }).status(200).send('Account deleted, removing cookie...')
    writeLog(`User ${req.session.username}: ${req.session.userId} deleted their account.`, 'Info', context, req.realIp)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.sendStatus(500)
  }
})

module.exports = router
