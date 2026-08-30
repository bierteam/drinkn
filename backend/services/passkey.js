const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server')
const { isoBase64URL, isoUint8Array } = require('@simplewebauthn/server/helpers')

const RP_NAME = 'Drinkn'

// pinned in production; the request is a localhost fallback, see setup.js
const rpID = req => process.env.RP_ID || req.hostname

const origin = req => process.env.RP_ORIGIN || `${req.protocol}://${req.get('host')}`

const toStored = credential => ({
  credentialID: credential.id,
  publicKey: isoBase64URL.fromBuffer(credential.publicKey),
  counter: credential.counter,
  transports: credential.transports || []
})

const fromStored = stored => ({
  id: stored.credentialID,
  publicKey: isoBase64URL.toBuffer(stored.publicKey),
  counter: stored.counter,
  transports: stored.transports
})

// naming a kind keeps the browser from offering the other one
const ATTACHMENTS = new Set(['platform', 'cross-platform'])

const attachmentOf = value => ATTACHMENTS.has(value) ? value : undefined

const registrationOptions = async (req, account, attachment) => {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpID(req),
    userID: isoUint8Array.fromUTF8String(account._id),
    userName: account.username,
    attestationType: 'none',
    // stops the browser from enrolling a key this account already holds
    excludeCredentials: (account.credentials || []).map(fromStored),
    authenticatorSelection: {
      // discoverable, so signing in needs no username first
      residentKey: 'required',
      userVerification: 'preferred',
      // absent, not undefined: some authenticators read that as "no kind"
      ...(attachmentOf(attachment) && { authenticatorAttachment: attachmentOf(attachment) })
    }
  })

  req.session.passkeyChallenge = options.challenge
  return options
}

const verifyRegistration = async (req, response) => {
  const expectedChallenge = req.session.passkeyChallenge
  // one challenge, one use: dropped before verifying, so a replay has nothing
  // left to check against
  delete req.session.passkeyChallenge

  if (!expectedChallenge) throw new Error('No passkey registration in progress')

  const { verified, registrationInfo } = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin(req),
    expectedRPID: rpID(req)
  })

  if (!verified) throw new Error('Passkey registration could not be verified')

  return toStored(registrationInfo.credential)
}

const authenticationOptions = async req => {
  const options = await generateAuthenticationOptions({
    rpID: rpID(req),
    // empty on purpose: the authenticator offers what it holds for this site
    allowCredentials: [],
    userVerification: 'preferred'
  })

  req.session.passkeyChallenge = options.challenge
  return options
}

const verifyAuthentication = async (req, response, stored) => {
  const expectedChallenge = req.session.passkeyChallenge
  delete req.session.passkeyChallenge

  if (!expectedChallenge) throw new Error('No passkey login in progress')

  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin(req),
    expectedRPID: rpID(req),
    credential: fromStored(stored)
  })

  if (!verified) throw new Error('Passkey could not be verified')

  return authenticationInfo.newCounter
}

module.exports = {
  registrationOptions,
  verifyRegistration,
  authenticationOptions,
  verifyAuthentication
}
