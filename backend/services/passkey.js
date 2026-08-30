const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server')
const { isoBase64URL, isoUint8Array } = require('@simplewebauthn/server/helpers')

const RP_NAME = 'Drinkn'

// The relying party id is the bare domain a passkey is scoped to, and the
// origin is the exact site the browser must be on. Both are pinned by
// configuration in production. They fall back to the request only so that
// `localhost` development works without extra setup -- see setup.js, which
// warns when the fallback is in play.
const rpID = req => process.env.RP_ID || req.hostname

const origin = req => process.env.RP_ORIGIN || `${req.protocol}://${req.get('host')}`

// mongo stores the credential id and public key as base64url text; the
// library works in bytes, so every crossing converts here rather than at
// each call site
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

// 'platform' is the fingerprint or face on this device, 'cross-platform' a
// key you plug in. Naming one keeps the browser from offering the other, and
// keeps a password manager from claiming a ceremony meant for a security key
// -- which it answers with a bare NotAllowedError, telling you nothing.
const ATTACHMENTS = ['platform', 'cross-platform']

const attachmentOf = value => ATTACHMENTS.includes(value) ? value : undefined

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
      // left out entirely when unset: an explicit undefined is still a key,
      // and some authenticators read it as "no kind is acceptable"
      ...(attachmentOf(attachment) && { authenticatorAttachment: attachmentOf(attachment) })
    }
  })

  req.session.passkeyChallenge = options.challenge
  return options
}

const verifyRegistration = async (req, response) => {
  const expectedChallenge = req.session.passkeyChallenge
  // one challenge, one use: drop it before verifying so a replay of the same
  // body cannot be checked against it a second time
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
    // left empty on purpose: the authenticator offers whichever passkey it
    // holds for this site, so the user never types a username
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
