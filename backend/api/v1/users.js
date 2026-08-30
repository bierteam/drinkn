const express = require('express')
const router = express.Router()
const user = require('../../models/user')
const isAdmin = require('../../services/isAdmin')
const isAuthenticated = require('../../services/isAuthenticated')
const rateLimit = require('../../services/rateLimit')
const passkey = require('../../services/passkey')
const oidc = require('../../services/oidc')
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

  let account
  try {
    account = await authenticateUser(req.body.username, req.body.password)
  } catch (error) {
    // never returned: unknown username and wrong password look the same
    writeLog(`Failed login attempt for user: ${req.body.username} (${error})`, 'Warning', context, req.realIp)
    return res.status(401).send('Incorrect username or password')
  }

  writeLog(`User ${account.username}: ${account._id} has logged in.`, 'Info', context, req.realIp)
  establishSession(req, account, req.body.remember)
  return res.status(200).send({ admin: account.admin, _id: account._id })
})

function establishSession (req, account, remember) {
  if (!remember) {
    req.session.cookie.expires = false
  }
  req.session.userId = account._id
  req.session.admin = account.admin
  req.session.username = account.username
}

// step one. No username: step two looks the account up from the credential id
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
  if (typeof response?.id !== 'string') {
    writeLog('Passkey login with a malformed response', 'Warning', context, req.realIp)
    return res.status(403).send('Missing fields')
  }

  const credentialID = String(response.id)
  const matchesCredential = { $eq: credentialID }

  try {
    const account = await user.findOne({ 'credentials.credentialID': matchesCredential }).exec()
    if (!account) throw new Error(`No account holds credential ${credentialID}`)

    const stored = account.credentials.find(credential => credential.credentialID === credentialID)
    const newCounter = await passkey.verifyAuthentication(req, response, stored)

    // only ever moves forward; this is what makes a clone detectable
    await user.updateOne(
      { _id: account._id, 'credentials.credentialID': matchesCredential },
      { $set: { 'credentials.$.counter': newCounter } }
    )

    writeLog(`User ${account.username}: ${account._id} has logged in with a passkey.`, 'Info', context, req.realIp)
    establishSession(req, account, req.body.remember)
    return res.status(200).send({ admin: account.admin, _id: account._id })
  } catch (error) {
    writeLog(`Failed passkey login attempt (${error})`, 'Warning', context, req.realIp)
    return res.status(401).send('That passkey was not accepted')
  }
})

// the frontend only offers the button when the deployment is configured for it
router.get('/login/oidc/enabled', rateLimit.api, function (req, res) {
  res.json({ enabled: oidc.enabled(), name: oidc.name() })
})

// only a path on this site. An absolute or protocol-relative url here would
// turn the login flow into an open redirect
const safeRedirect = value => typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : ''

// an oauth error code is a bare token. Anyone can walk a browser into the
// callback, so whatever arrives there is theirs to choose: the description is
// free text and stays out of the log entirely, and the code is cut down to
// what the spec allows before it is written
const errorCode = value => String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'unknown'

// a browser navigation rather than an xhr, so it has to be a GET: csrf-sync
// skips those, and there is no session to protect yet anyway
// rateLimit.api rather than auth: nothing here checks a credential, and the
// auth budget is shared with the password and passkey routes -- spending two
// of it on every round trip locks a fumbled sign-in out of those as well
router.get('/login/oidc', rateLimit.api, async function (req, res) {
  if (!oidc.enabled()) return res.status(404).send('Single sign-on is not configured')

  try {
    const flow = await oidc.startFlow()

    // the verifier stays here; only its hash travels with the browser
    req.session.oidc = {
      ...flow,
      remember: req.query.remember !== 'false',
      redirect: safeRedirect(req.query.redirect)
    }

    const url = await oidc.authorizationUrl({ ...flow, redirectUri: oidc.redirectUri(req) })
    res.redirect(url)
  } catch (err) {
    console.error(err)
    writeLog(`Could not start single sign-on (${err})`, 'Error', context, req.realIp)
    res.status(502).send('Single sign-on is unavailable')
  }
})

router.get('/login/oidc/callback', rateLimit.auth, async function (req, res) {
  const flow = req.session.oidc
  // one login, one flow: dropped before anything is checked, so a replayed
  // callback has nothing left to match against
  delete req.session.oidc

  const fail = (reason, message) => {
    writeLog(`Failed single sign-on (${reason})`, 'Warning', context, req.realIp)
    return res.redirect(`/login?error=${encodeURIComponent(message)}`)
  }

  if (!oidc.enabled()) return fail('not configured', 'Single sign-on is not configured')
  if (req.query.error) return fail(`the issuer refused it: ${errorCode(req.query.error)}`, 'Sign-in was refused')
  if (!flow) return fail('no flow in the session', 'That sign-in took too long, try again')

  try {
    // the state, the code exchange and the id token are all checked in here
    const claims = await oidc.complete(req, flow)
    const account = await linkFederatedAccount(oidc.profile(claims))

    await regenerateSession(req)
    establishSession(req, account, flow.remember)

    writeLog(`User ${account.username}: ${account._id} has logged in with ${oidc.name()}.`, 'Info', context, req.realIp)

    const redirect = flow.redirect ? `&redirect=${encodeURIComponent(flow.redirect)}` : ''
    return res.redirect(`/login?oidc=1${redirect}`)
  } catch (error) {
    console.error(error)
    return fail(oidc.describe(error), 'That sign-in was not accepted')
  }
})

// a fresh id before the account is written into it, so a session fixed in the
// browser beforehand cannot be ridden into the account afterwards
const regenerateSession = req => new Promise((resolve, reject) => {
  if (typeof req.session.regenerate !== 'function') return resolve()
  req.session.regenerate(err => err ? reject(err) : resolve())
})

async function linkFederatedAccount (profile) {
  const subject = { $eq: profile.subject }
  const issuer = { $eq: profile.issuer }

  let account = await user.findOne({ 'oidc.subject': subject, 'oidc.issuer': issuer }).exec()

  if (!account) {
    // a username that already exists here. Matching one is not proof of owning
    // it -- the claim is whatever the issuer lets the subject call itself, and
    // renaming upstream to an admin's name would otherwise hand the account
    // over -- so claiming it is opt-in, and a collision is refused without it
    const named = await user.findOne({ username: { $eq: profile.username } }).exec()

    if (named && !oidc.linkByUsername()) {
      throw new Error(`${profile.username} already exists here and is not linked to a subject`)
    }

    // and never one already answering to somebody else's subject
    if (named?.oidc?.subject) {
      throw new Error(`${profile.username} is already linked to another subject`)
    }

    account = named
  }

  if (!account) {
    if (!oidc.allowSignup()) throw new Error(`No account for ${profile.username} and signup is off`)

    return user.create({
      username: profile.username,
      admin: profile.admin === true,
      oidc: { issuer: profile.issuer, subject: profile.subject }
    })
  }

  const parameters = { oidc: { issuer: profile.issuer, subject: profile.subject } }
  // only when a group is configured; otherwise the issuer has no say and
  // whatever the account already holds stands
  if (profile.admin !== null) parameters.admin = profile.admin

  // findOneAndUpdate rather than save(): the pre-save hook would hash the
  // already-hashed password a second time
  return user.findOneAndUpdate({ _id: account._id }, { $set: parameters }, { new: true }).exec()
}

// what the frontend needs to rebuild its store after coming back from the
// issuer, where a redirect left it no response body to read
router.get('/session', rateLimit.api, isAuthenticated, function (req, res) {
  res.json({ _id: req.session.userId, username: req.session.username, admin: !!req.session.admin })
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
// nothing is returned unless PR is set, so production answers with nothing
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
