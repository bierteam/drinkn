const http = require('node:http')
const crypto = require('node:crypto')

// A real OpenID provider, small enough to run in a test. The point is that
// nothing about the exchange is mocked: openid-client talks http to this,
// verifies signatures against its jwks and checks the pkce challenge here.
const base64url = value => Buffer.from(JSON.stringify(value)).toString('base64url')

const challengeFor = verifier => crypto.createHash('sha256').update(verifier).digest('base64url')

const start = async () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }

  // one authorization code at a time is all a test needs
  const codes = new Map()
  // lets a test bend a single response without rewriting the server
  const quirks = { tokenStatus: null, signWith: privateKey, claims: {} }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(body))
    }

    if (url.pathname === '/.well-known/openid-configuration') {
      return send(200, {
        issuer: issuer(),
        authorization_endpoint: `${issuer()}/auth`,
        token_endpoint: `${issuer()}/token`,
        jwks_uri: `${issuer()}/keys`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'email', 'groups', 'profile'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none']
      })
    }

    if (url.pathname === '/keys') return send(200, { keys: [jwk] })

    if (url.pathname === '/token' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk
      })
      req.on('end', () => {
        if (quirks.tokenStatus) return send(quirks.tokenStatus, { error: 'invalid_grant', error_description: 'code expired' })

        const form = new URLSearchParams(body)
        const issued = codes.get(form.get('code'))

        if (!issued) return send(400, { error: 'invalid_grant', error_description: 'unknown code' })
        // a public client sends no secret, so this is what stands in for it
        if (challengeFor(form.get('code_verifier') || '') !== issued.challenge) {
          return send(400, { error: 'invalid_grant', error_description: 'pkce verifier does not match' })
        }
        if (form.get('client_id') !== issued.clientId) {
          return send(401, { error: 'invalid_client', error_description: 'wrong client' })
        }
        if (form.get('redirect_uri') !== issued.redirectUri) {
          return send(400, { error: 'invalid_grant', error_description: 'redirect_uri does not match' })
        }
        if (form.has('client_secret')) {
          return send(400, { error: 'invalid_request', error_description: 'a public client sends no secret' })
        }

        const now = Math.floor(Date.now() / 1000)
        const claims = {
          iss: issuer(),
          aud: issued.clientId,
          sub: 'CgVvc2NhchIGZ2l0aHVi',
          exp: now + 300,
          iat: now,
          nonce: issued.nonce,
          preferred_username: 'Oscrx',
          email: 'oscar@example.test',
          groups: ['bierteam:beheer'],
          ...quirks.claims
        }
        const signed = `${base64url({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })}.${base64url(claims)}`
        const signature = crypto.sign('sha256', Buffer.from(signed), quirks.signWith).toString('base64url')

        return send(200, {
          access_token: 'an-access-token',
          token_type: 'bearer',
          expires_in: 300,
          id_token: `${signed}.${signature}`
        })
      })
      return
    }

    send(404, { error: 'not_found' })
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const issuer = () => `http://127.0.0.1:${server.address().port}`

  const reset = () => Object.assign(quirks, { tokenStatus: null, signWith: privateKey, claims: {} })

  return {
    url: issuer(),
    quirks,
    // puts the signing key and everything else back to honest defaults
    reset,
    // what the provider would have done at /auth, without a browser
    authorize: ({ url, clientId, redirectUri, nonce }) => {
      const parameters = new URL(url).searchParams
      const code = crypto.randomBytes(12).toString('hex')
      codes.set(code, {
        challenge: parameters.get('code_challenge'),
        clientId,
        redirectUri,
        nonce: nonce === undefined ? parameters.get('nonce') : nonce
      })
      return code
    },
    stop: () => new Promise(resolve => server.close(resolve))
  }
}

module.exports = { start, challengeFor }
