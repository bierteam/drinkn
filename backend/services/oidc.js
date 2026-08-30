// Authorization Code flow with PKCE against a public client, so there is no
// client secret to store anywhere. The exchange happens here rather than in
// the browser: only the code ever reaches it, and the tokens never leave.
//
// openid-client validates the state, exchanges the code and verifies the id
// token -- signature, issuer, audience, expiry and nonce -- so none of that
// is hand rolled here.
const CALLBACK_PATH = '/api/v1/users/login/oidc/callback'

const DEFAULT_SCOPES = 'openid profile email groups'

// openid-client ships only esm and this service is commonjs. Its readme
// notes require() works wherever node enables require(esm) (^20.19 || ^22.12
// || >=23), and node does -- but under jest that only holds from node 24.9,
// and only with --experimental-vm-modules. A dynamic import needs the same
// flag and works on every node this project runs on, so it is the form both
// agree on, kept once it resolves. The flag is set in the test script;
// production never needs it.
let library
const openid = async () => {
  library = library || await import('openid-client')
  return library
}

// read per call rather than at load: the tests swap the environment around,
// and nothing here is hot enough to care
const config = () => ({
  issuer: (process.env.OIDC_ISSUER || '').replace(/\/+$/, ''),
  clientId: process.env.OIDC_CLIENT_ID || '',
  scopes: process.env.OIDC_SCOPES || DEFAULT_SCOPES,
  usernameClaim: process.env.OIDC_USERNAME_CLAIM || 'preferred_username',
  adminGroup: process.env.OIDC_ADMIN_GROUP || '',
  // an unknown subject gets an account; the issuer already decides who may ask
  allowSignup: process.env.OIDC_ALLOW_SIGNUP !== 'false',
  // off by default: a username claim is not proof of owning the local account
  // that already answers to that name, so claiming one is opt-in
  linkByUsername: process.env.OIDC_LINK_BY_USERNAME === 'true',
  name: process.env.OIDC_NAME || 'single sign-on'
})

const enabled = () => Boolean(config().issuer && config().clientId)

const name = () => config().name

const allowSignup = () => config().allowSignup

const linkByUsername = () => config().linkByUsername

// pinned in production, request-derived only as a localhost fallback -- the
// same precedence passkey.js uses, and dex matches this string exactly
const redirectUri = req => process.env.OIDC_REDIRECT_URI
  || `${process.env.RP_ORIGIN || `${req.protocol}://${req.get('host')}`}${CALLBACK_PATH}`

let discovered = { issuer: '', clientId: '', configuration: null }

const discover = async () => {
  const client = await openid()
  const { issuer, clientId } = config()
  if (!issuer) throw new Error('OIDC_ISSUER is not set')

  if (discovered.configuration && discovered.issuer === issuer && discovered.clientId === clientId) {
    return discovered.configuration
  }

  // openid-client takes the spec's out and skips the id token signature,
  // since the token came straight off a tls connection to the issuer. Cheap
  // enough to check anyway -- one jwks fetch -- and it means a broken or
  // hostile proxy in front of dex is not on its own enough to forge a login.
  const execute = [client.enableNonRepudiationChecks]

  // the fake issuer the tests run against speaks http on localhost. Passed to
  // discovery rather than applied after, so the discovery request itself is
  // allowed too, and there is no way to reach this branch outside a test
  if (process.env.NODE_ENV === 'test') execute.push(client.allowInsecureRequests)

  // None(): a public client sends no secret, the verifier stands in for it
  const configuration = await client.discovery(new URL(issuer), clientId, undefined, client.None(), { execute })

  discovered = { issuer, clientId, configuration }
  return configuration
}

// everything the callback has to remember, and nothing that may not sit in a
// session: the verifier is the only half of the pkce pair that stays here
const startFlow = async () => {
  const client = await openid()
  return {
    state: client.randomState(),
    nonce: client.randomNonce(),
    verifier: client.randomPKCECodeVerifier()
  }
}

const authorizationUrl = async ({ state, nonce, verifier, redirectUri: uri }) => {
  const client = await openid()

  return client.buildAuthorizationUrl(await discover(), {
    redirect_uri: uri,
    scope: config().scopes,
    state,
    nonce,
    // only the hash of the verifier travels with the browser
    code_challenge: await client.calculatePKCECodeChallenge(verifier),
    code_challenge_method: 'S256'
  }).toString()
}

// what the browser came back to, rebuilt from the registered redirect uri so
// the token request repeats it exactly -- openid-client strips the query off
// this and sends the rest as redirect_uri
const callbackUrl = (req, uri) => {
  const url = new URL(uri)
  url.search = new URLSearchParams(req.query).toString()
  return url
}

// validates the state, exchanges the code with the verifier and verifies the
// id token, then hands back its claims
const complete = async (req, flow) => {
  const client = await openid()
  const uri = redirectUri(req)

  const tokens = await client.authorizationCodeGrant(await discover(), callbackUrl(req, uri), {
    pkceCodeVerifier: flow.verifier,
    expectedState: flow.state,
    expectedNonce: flow.nonce,
    idTokenExpected: true
  })

  const claims = tokens.claims()
  if (!claims) throw new Error('The token response carried no id_token')
  return claims
}

// openid-client keeps the useful half off the message: an error the provider
// sent back carries its own description, and a failed check names itself on
// the cause. Without this the log just reads "invalid response encountered".
const describe = error => {
  if (error?.error) return [error.error, error.error_description].filter(Boolean).join(': ')
  return [error?.message, error?.cause?.message].filter(Boolean).join(': ')
}

// the username is stored lowercase, and github logins are not
const usernameFrom = claims => {
  const { usernameClaim } = config()
  const value = claims[usernameClaim] || claims.email || claims.sub
  return String(value).trim().toLowerCase()
}

// null rather than []: an absent claim is the issuer saying nothing about
// groups, which is not the same as saying the subject is in none of them
const groupsFrom = claims => {
  if (Array.isArray(claims.groups)) return claims.groups
  // a single group travels bare rather than in a list on some providers
  if (typeof claims.groups === 'string') return [claims.groups]
  return null
}

const profile = claims => {
  const { adminGroup } = config()
  const groups = groupsFrom(claims)

  return {
    issuer: claims.iss,
    subject: claims.sub,
    username: usernameFrom(claims),
    // no group configured, or no groups claim to read it against, means the
    // issuer has no say over admin and whatever the account already holds
    // stands. Answering false to a missing claim would demote every admin
    // the moment they signed in through an issuer that scopes groups away
    admin: adminGroup && groups ? groups.includes(adminGroup) : null
  }
}

module.exports = {
  CALLBACK_PATH,
  enabled,
  name,
  allowSignup,
  linkByUsername,
  redirectUri,
  startFlow,
  authorizationUrl,
  complete,
  describe,
  profile,
  // exported so a test can point the service at a different issuer
  _reset: () => { discovered = { issuer: '', clientId: '', configuration: null } }
}
