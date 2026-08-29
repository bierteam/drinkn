const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAdmin = require('../../services/isAdmin')
const rateLimit = require('../../services/rateLimit')
const passkey = require('../../services/passkey')
const writeLog = require('../../services/writeLog')
const sessionCookie = require('../../services/sessionCookie')
const context = 'Users'

// enough to list and revoke a passkey, and no key material
const PASSKEY_FIELDS = 'credentials.credentialID credentials.name credentials.createdAt'

router.post('/login', rateLimit.auth, async function (req, res) {
  if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
    writeLog('Login try with missing fields', 'Warning', context, req.realIp)
    return res.status(403).send('Missing fields')
  }

  // named `account` so it does not shadow the user model imported above
  let account
  try {
    account = await authenticateUser(req.body.username, req.body.password)
  } catch (error) {
    // the reason is recorded here but never returned, so a caller cannot tell
    // an unknown username from a wrong password
    writeLog(`Failed login attempt for user: ${req.body.username} (${error})`, 'Warning', context, req.realIp)
    return res.status(401).send('Incorrect username or password')
  }

  writeLog(`User ${account.username}: ${account._id} has logged in.`, 'Info', context, req.realIp)
  establishSession(req, account, req.body.remember)
  return res.status(200).send({ admin: account.admin, _id: account._id })
})

// shared by the password and passkey routes below, so both end a login the
// same way
function establishSession (req, account, remember) {
  if (!remember) {
    req.session.cookie.expires = false
  }
  req.session.userId = account._id
  req.session.admin = account.admin
  req.session.username = account.username
}

// Step one of a passkey login. No username is asked for: the credentials are
// discoverable, so the authenticator offers whichever passkey it holds for
// this site and step two looks the account up from the credential id.
router.post('/login/passkey/options', rateLimit.auth, async function (req, res) {
  try {
    const options = await passkey.authenticationOptions(req)
    res.json(options)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login/passkey', rateLimit.auth, async function (req, res) {
  const response = req.body.response
  // must be a string: a bare truthy check would let an operator object such as
  // {"$ne": null} through and straight into the query below
  if (typeof response?.id !== 'string') {
    writeLog('Passkey login with a malformed response', 'Warning', context, req.realIp)
    return res.status(403).send('Missing fields')
  }

  // String() hands the query a fresh primitive rather than whatever came off
  // the body, and $eq forces mongo to compare it as a literal, so neither the
  // value nor its type can steer the query
  const credentialID = String(response.id)
  const matchesCredential = { $eq: credentialID }

  try {
    const account = await user.findOne({ 'credentials.credentialID': matchesCredential }).exec()
    if (!account) throw new Error(`No account holds credential ${credentialID}`)

    const stored = account.credentials.find(credential => credential.credentialID === credentialID)
    const newCounter = await passkey.verifyAuthentication(req, response, stored)

    // the signature counter only ever moves forward; persisting it is what
    // makes a cloned authenticator detectable later
    await user.updateOne(
      { _id: account._id, 'credentials.credentialID': matchesCredential },
      { $set: { 'credentials.$.counter': newCounter } }
    )

    writeLog(`User ${account.username}: ${account._id} has logged in with a passkey.`, 'Info', context, req.realIp)
    establishSession(req, account, req.body.remember)
    return res.status(200).send({ admin: account.admin, _id: account._id })
  } catch (error) {
    // as with the password route, the reason stays server-side
    writeLog(`Failed passkey login attempt (${error})`, 'Warning', context, req.realIp)
    return res.status(401).send('That passkey was not accepted')
  }
})

async function authenticateUser (username, password) {
  return new Promise((resolve, reject) => {
    user.authenticate(username, password, function (error, user) {
      if (error || !user) {
        reject(error || 'Incorrect username or password')
      } else {
        resolve(user)
      }
    })
  })
}

router.delete('/logout', function (req, res) {
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        res.sendStatus(500)
        writeLog(err, 'Error', context)
      } else {
        res.clearCookie('connect.sid', sessionCookie.cookie).status(200).send('Cookie deleted.')
      }
    })
  }
})

router.post('/register', rateLimit.api, isAdmin, async function (req, res) {
  if (req.body.username && req.body.password) {
    try {
      const userData = {
        username: req.body.username.toString(),
        password: req.body.password.toString(),
        admin: req.body.admin,
        createdBy: { _id: req.session.userId, username: req.session.username }
      }
      await user.create(userData)
      writeLog(`User account ${userData.username} has been created by ${req.session.username}: ${req.session.userId}`, 'Info', context, req.realIp)
      res.sendStatus(201)
    } catch (err) {
      writeLog(err, 'Error', context)
      res.status(200).send('Something went wrong, maybe the user already exists...')
    }
  }
})
// Preview namespaces are seeded with a throwaway account and are meant to be
// opened by anyone reviewing the PR. Nothing is returned unless PR is set, so
// production never answers with credentials.
router.get('/preview', rateLimit.api, function (req, res) {
  if (!process.env.PR) return res.json({ enabled: false })

  res.json({
    enabled: true,
    username: process.env.DEFAULT_USER,
    password: process.env.DEFAULT_PASS
  })
})

router.get('/check', rateLimit.api, async function (req, res) {
  try {
    const isUserLoggedIn = !!req.session.userId
    res.send(isUserLoggedIn)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/', rateLimit.api, isAdmin, async function (req, res) {
  try {
    const results = await user.find().select('username admin').exec()
    writeLog(`${req.session.username}: ${req.session.userId} requested users data`, 'Info', context, req.realIp)
    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:_id', rateLimit.api, isAdmin, async function (req, res) {
  try {
    const _id = { _id: req.params._id }
    const result = await user.findOne(_id).select(`username admin createdBy editedBy ${PASSKEY_FIELDS}`).exec()
    writeLog(`${req.session.username}: ${req.session.userId} requested ${req.params._id}`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:_id', rateLimit.api, isAdmin, async function (req, res) {
  try {
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

    const result = await user.findOneAndUpdate({ _id }, { $set: parameters }, { strict: false, new: true })
      .select(`username admin ${PASSKEY_FIELDS}`)
      .exec()

    writeLog(`${req.session.username}: ${req.session.userId} updated ${result}`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:_id/passkey/:credentialID', rateLimit.api, isAdmin, async function (req, res) {
  try {
    const _id = req.params._id

    const result = await user.findOneAndUpdate(
      { _id },
      { $pull: { credentials: { credentialID: req.params.credentialID } } },
      { new: true }
    ).select(`username admin ${PASSKEY_FIELDS}`).exec()

    if (!result) return res.status(404).send('No such user')

    writeLog(`${req.session.username}: ${req.session.userId} revoked a passkey for ${_id}`, 'Warning', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:_id', rateLimit.api, isAdmin, async function (req, res) {
  try {
    await user.deleteOne({ _id: req.params._id })
    res.sendStatus(200)
    writeLog(`${req.session.username}: ${req.session.userId} deleted user ${req.params._id}`, 'Warning', context, req.realIp)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.sendStatus(500)
  }
})

module.exports = router
