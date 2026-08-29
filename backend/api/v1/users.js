const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAdmin = require('../../services/isAdmin')
const passkey = require('../../services/passkey')
const writeLog = require('../../services/writeLog')
const context = 'Users'

router.post('/login', async function (req, res) {
  if (!req.body.username || !req.body.password) {
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
router.post('/login/passkey/options', async function (req, res) {
  try {
    const options = await passkey.authenticationOptions(req)
    res.json(options)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login/passkey', async function (req, res) {
  const response = req.body.response
  if (!response?.id) {
    writeLog('Passkey login with a malformed response', 'Warning', context, req.realIp)
    return res.status(403).send('Missing fields')
  }

  try {
    const account = await user.findOne({ 'credentials.credentialID': response.id }).exec()
    if (!account) throw new Error(`No account holds credential ${response.id}`)

    const stored = account.credentials.find(credential => credential.credentialID === response.id)
    const newCounter = await passkey.verifyAuthentication(req, response, stored)

    // the signature counter only ever moves forward; persisting it is what
    // makes a cloned authenticator detectable later
    await user.updateOne(
      { _id: account._id, 'credentials.credentialID': response.id },
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
        res.clearCookie('connect.sid', { path: '/' }).status(200).send('Cookie deleted.')
      }
    })
  }
})

router.post('/register', isAdmin, async function (req, res) {
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
router.get('/check', async function (req, res) {
  try {
    const isUserLoggedIn = !!req.session.userId
    res.send(isUserLoggedIn)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/', isAdmin, async function (req, res) {
  try {
    const results = await user.find().select('username admin').exec()
    writeLog(`${req.session.username}: ${req.session.userId} requested users data`, 'Info', context, req.realIp)
    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:_id', isAdmin, async function (req, res) {
  try {
    const _id = { _id: req.params._id }
    const result = await user.findOne(_id).select('username admin createdBy editedBy credentials.name credentials.createdAt').exec()
    writeLog(`${req.session.username}: ${req.session.userId} requested ${req.params._id}`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:_id', isAdmin, async function (req, res) {
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
      .select('username admin')
      .exec()

    writeLog(`${req.session.username}: ${req.session.userId} updated ${result}`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:_id', isAdmin, async function (req, res) {
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
