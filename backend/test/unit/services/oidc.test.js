const crypto = require('node:crypto')
const oidc = require('../../../services/oidc')
const issuerHelper = require('../helpers/issuer')

const CLIENT_ID = 'pils'
const REDIRECT_URI = `https://pils.example.test${oidc.CALLBACK_PATH}`

let issuer

// nothing here is mocked: this drives the real openid-client against a real
// provider over http, the way the callback route does
const signIn = async ({ flow, code, state, extraQuery = {} } = {}) => {
  flow = flow || await oidc.startFlow()
  const url = await oidc.authorizationUrl({ ...flow, redirectUri: REDIRECT_URI })

  code = code === undefined
    ? issuer.authorize({ url, clientId: CLIENT_ID, redirectUri: REDIRECT_URI })
    : code

  const req = { query: { code, state: state === undefined ? flow.state : state, ...extraQuery } }
  return { flow, url, claims: await oidc.complete(req, flow) }
}

// what the callback route would put in the log, so the assertions below are
// about the reason a sign-in was refused rather than a generic wrapper
const refusalFrom = async attempt => {
  try {
    await attempt()
  } catch (error) {
    return oidc.describe(error)
  }
  throw new Error('that sign-in was accepted and should not have been')
}

beforeAll(async () => {
  issuer = await issuerHelper.start()
})

afterAll(async () => {
  await issuer.stop()
})

beforeEach(() => {
  process.env.OIDC_ISSUER = issuer.url
  process.env.OIDC_CLIENT_ID = CLIENT_ID
  process.env.OIDC_REDIRECT_URI = REDIRECT_URI
  delete process.env.OIDC_ADMIN_GROUP
  delete process.env.OIDC_ALLOW_SIGNUP
  delete process.env.OIDC_LINK_BY_USERNAME
  delete process.env.OIDC_USERNAME_CLAIM
  delete process.env.RP_ORIGIN

  issuer.reset()
  oidc._reset()
})

afterEach(() => {
  for (const key of ['OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_REDIRECT_URI']) delete process.env[key]
})

describe('enabled', () => {
  it('is on once an issuer and a client are configured', () => {
    expect(oidc.enabled()).toBe(true)
  })

  it.each(['OIDC_ISSUER', 'OIDC_CLIENT_ID'])('is off without %s', key => {
    delete process.env[key]
    expect(oidc.enabled()).toBe(false)
  })
})

describe('redirectUri', () => {
  it('prefers the configured value', () => {
    expect(oidc.redirectUri({})).toBe(REDIRECT_URI)
  })

  it('builds one from the pinned origin', () => {
    delete process.env.OIDC_REDIRECT_URI
    process.env.RP_ORIGIN = 'https://pils.example.test'
    expect(oidc.redirectUri({})).toBe(REDIRECT_URI)
  })

  it('falls back to the request when nothing is pinned', () => {
    delete process.env.OIDC_REDIRECT_URI
    const req = { protocol: 'http', get: () => 'localhost:3000' }
    expect(oidc.redirectUri(req)).toBe(`http://localhost:3000${oidc.CALLBACK_PATH}`)
  })
})

describe('startFlow', () => {
  it('hands out a fresh state, nonce and verifier every time', async () => {
    const one = await oidc.startFlow()
    const other = await oidc.startFlow()

    for (const key of ['state', 'nonce', 'verifier']) {
      expect(typeof one[key]).toBe('string')
      expect(one[key].length).toBeGreaterThanOrEqual(20)
      expect(one[key]).not.toBe(other[key])
    }
  })
})

describe('authorizationUrl', () => {
  it('asks the issuer for a code against the configured client', async () => {
    const flow = await oidc.startFlow()
    const url = new URL(await oidc.authorizationUrl({ ...flow, redirectUri: REDIRECT_URI }))

    expect(url.origin + url.pathname).toBe(`${issuer.url}/auth`)
    expect(url.searchParams.get('client_id')).toBe(CLIENT_ID)
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI)
    expect(url.searchParams.get('scope')).toBe('openid profile email groups')
    expect(url.searchParams.get('state')).toBe(flow.state)
    expect(url.searchParams.get('nonce')).toBe(flow.nonce)
  })

  it('sends the S256 challenge and never the verifier', async () => {
    const flow = await oidc.startFlow()
    const url = await oidc.authorizationUrl({ ...flow, redirectUri: REDIRECT_URI })

    expect(new URL(url).searchParams.get('code_challenge'))
      .toBe(issuerHelper.challengeFor(flow.verifier))
    expect(new URL(url).searchParams.get('code_challenge_method')).toBe('S256')
    expect(url).not.toContain(flow.verifier)
  })

  it('refuses to build one without an issuer', async () => {
    delete process.env.OIDC_ISSUER
    oidc._reset()

    await expect(oidc.authorizationUrl({ redirectUri: REDIRECT_URI })).rejects.toThrow(/OIDC_ISSUER is not set/)
  })
})

describe('a whole sign-in', () => {
  it('comes back with the claims the issuer signed', async () => {
    const { claims } = await signIn()

    expect(claims.iss).toBe(issuer.url)
    expect(claims.aud).toBe(CLIENT_ID)
    expect(claims.sub).toBe('CgVvc2NhchIGZ2l0aHVi')
    expect(claims.preferred_username).toBe('Oscrx')
  })

  it('sends no client secret anywhere', async () => {
    // the issuer rejects a request carrying one, so arriving here proves it
    await expect(signIn()).resolves.toBeTruthy()
  })

  it('reuses the discovery document across sign-ins', async () => {
    const spy = jest.spyOn(global, 'fetch')
    await signIn()
    await signIn()

    const discoveries = spy.mock.calls.filter(([url]) => String(url).includes('openid-configuration'))
    expect(discoveries).toHaveLength(1)
    spy.mockRestore()
  })
})

describe('a sign-in that should not be accepted', () => {
  it('refuses a state that does not match the session', async () => {
    await expect(refusalFrom(() => signIn({ state: 'someone-elses-state' })))
      .resolves.toMatch(/"state" response parameter/)
  })

  it('refuses a response with no state at all', async () => {
    await expect(refusalFrom(() => signIn({ state: null })))
      .resolves.toMatch(/"state" response parameter/)
  })

  it('refuses a verifier that does not match the challenge', async () => {
    const flow = await oidc.startFlow()
    const url = await oidc.authorizationUrl({ ...flow, redirectUri: REDIRECT_URI })
    const code = issuer.authorize({ url, clientId: CLIENT_ID, redirectUri: REDIRECT_URI })

    // the pkce pair is what stands in for the secret, so a swapped verifier
    // has to be refused by the issuer
    const stolen = { ...flow, verifier: (await oidc.startFlow()).verifier }

    await expect(refusalFrom(() => oidc.complete({ query: { code, state: flow.state } }, stolen)))
      .resolves.toMatch(/pkce verifier does not match/)
  })

  it('refuses an id token answering a different login', async () => {
    const flow = await oidc.startFlow()
    const url = await oidc.authorizationUrl({ ...flow, redirectUri: REDIRECT_URI })
    const code = issuer.authorize({ url, clientId: CLIENT_ID, redirectUri: REDIRECT_URI, nonce: 'another-login' })

    await expect(refusalFrom(() => oidc.complete({ query: { code, state: flow.state } }, flow)))
      .resolves.toMatch(/"nonce"/)
  })

  it('refuses an id token signed by somebody else', async () => {
    issuer.quirks.signWith = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey

    await expect(refusalFrom(signIn)).resolves.toMatch(/signature/i)
  })

  it('refuses an expired id token', async () => {
    issuer.quirks.claims = { exp: Math.floor(Date.now() / 1000) - 3600 }

    await expect(refusalFrom(signIn)).resolves.toMatch(/"exp"/)
  })

  it('refuses an id token minted for another client', async () => {
    issuer.quirks.claims = { aud: 'kubernetes' }

    await expect(refusalFrom(signIn)).resolves.toMatch(/"aud"/)
  })

  it('refuses an id token from another issuer', async () => {
    issuer.quirks.claims = { iss: 'https://evil.test' }

    await expect(refusalFrom(signIn)).resolves.toMatch(/"iss"/)
  })

  it('refuses an unknown code', async () => {
    await expect(refusalFrom(() => signIn({ code: 'never-issued' })))
      .resolves.toMatch(/invalid_grant: unknown code/)
  })

  it('surfaces what the token endpoint complained about', async () => {
    issuer.quirks.tokenStatus = 400

    await expect(refusalFrom(signIn)).resolves.toMatch(/invalid_grant: code expired/)
  })
})

describe('profile', () => {
  const claimsFor = (overrides = {}) => ({
    iss: 'https://auth.example.test',
    sub: 'the-subject',
    preferred_username: 'Oscrx',
    email: 'Oscar@Example.test',
    groups: ['bierteam:beheer'],
    ...overrides
  })

  it('lowercases the username the issuer sent', () => {
    expect(oidc.profile(claimsFor()).username).toBe('oscrx')
  })

  it('reads the configured claim instead', () => {
    process.env.OIDC_USERNAME_CLAIM = 'email'
    expect(oidc.profile(claimsFor()).username).toBe('oscar@example.test')
  })

  it('falls back to the email and then the subject', () => {
    expect(oidc.profile(claimsFor({ preferred_username: undefined })).username).toBe('oscar@example.test')
    expect(oidc.profile(claimsFor({ preferred_username: undefined, email: undefined })).username).toBe('the-subject')
  })

  it('leaves admin alone when no group is configured', () => {
    expect(oidc.profile(claimsFor()).admin).toBeNull()
  })

  it('grants admin to a member of the configured group', () => {
    process.env.OIDC_ADMIN_GROUP = 'bierteam:beheer'
    expect(oidc.profile(claimsFor()).admin).toBe(true)
  })

  it('withholds admin from everyone else', () => {
    process.env.OIDC_ADMIN_GROUP = 'bierteam:beheer'
    expect(oidc.profile(claimsFor({ groups: ['bierteam:gasten'] })).admin).toBe(false)
  })

  // an issuer that scopes groups away says nothing about them, and answering
  // false to that would demote every admin the moment they signed in
  it('leaves admin alone when the token carries no groups at all', () => {
    process.env.OIDC_ADMIN_GROUP = 'bierteam:beheer'
    expect(oidc.profile(claimsFor({ groups: undefined })).admin).toBeNull()
  })

  it('reads a lone group sent bare rather than in a list', () => {
    process.env.OIDC_ADMIN_GROUP = 'bierteam:beheer'
    expect(oidc.profile(claimsFor({ groups: 'bierteam:beheer' })).admin).toBe(true)
    expect(oidc.profile(claimsFor({ groups: 'bierteam:gasten' })).admin).toBe(false)
  })

  it('reads the real claims a sign-in produced', async () => {
    process.env.OIDC_ADMIN_GROUP = 'bierteam:beheer'
    const { claims } = await signIn()

    expect(oidc.profile(claims)).toEqual({
      issuer: issuer.url,
      subject: 'CgVvc2NhchIGZ2l0aHVi',
      username: 'oscrx',
      admin: true
    })
  })
})

describe('linkByUsername', () => {
  it('is off unless it is turned on', () => {
    expect(oidc.linkByUsername()).toBe(false)
    process.env.OIDC_LINK_BY_USERNAME = 'true'
    expect(oidc.linkByUsername()).toBe(true)
  })
})

describe('allowSignup', () => {
  it('is on unless it is turned off', () => {
    expect(oidc.allowSignup()).toBe(true)
    process.env.OIDC_ALLOW_SIGNUP = 'false'
    expect(oidc.allowSignup()).toBe(false)
  })
})
