const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAdmin = require('../../services/isAdmin')
const otp = require('../../services/otp')
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
    account = await authenticateUser(req.body.username, req.body.password, req.body.token)
  } catch (error) {
    // the reason is recorded here but never returned, so a caller cannot tell
    // an unknown username from a wrong password
    writeLog(`Failed login attempt for user: ${req.body.username} (${error})`, 'Warning', context, req.realIp)
    return res.status(401).send('Incorrect username or password')
  }

  const needsToken = Boolean(account.otp?.status)
  if (needsToken && !req.body.token) {
    writeLog(`User ${account.username}: ${account._id} requires a 2fa token.`, 'Info', context, req.realIp)
    return res.json({ otp: true })
  }
  if (needsToken && !otp.check(req.body.token, account.otp.secret)) {
    return res.status(401).send('The 2FA code is only valid for 30 seconds, try again.')
  }

  writeLog(`User ${account.username}: ${account._id} has logged in.`, 'Info', context, req.realIp)
  if (!req.body.remember) {
    req.session.cookie.expires = false
  }
  req.session.userId = account._id
  req.session.admin = account.admin
  req.session.username = account.username
  return res.status(200).send({ admin: account.admin, _id: account._id })
})

async function authenticateUser (username, password, token) {
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
    const result = await user.findOne(_id).select('username admin createdBy editedBy otp.status').exec()
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
