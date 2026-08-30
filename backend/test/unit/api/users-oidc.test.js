jest.mock('../../../models/user', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), create: jest.fn() }))
jest.mock('../../../services/passkey', () => ({}))
jest.mock('../../../services/oidc', () => ({
  CALLBACK_PATH: '/api/v1/users/login/oidc/callback',
  enabled: jest.fn(),
  name: jest.fn(),
  allowSignup: jest.fn(),
  linkByUsername: jest.fn(),
  redirectUri: jest.fn(),
  startFlow: jest.fn(),
  authorizationUrl: jest.fn(),
  complete: jest.fn(),
  describe: jest.fn(),
  profile: jest.fn()
}))
jest.mock('../../../services/writeLog', () => jest.fn())
jest.mock('../../../services/isAdmin', () => (req, res, next) => next())
jest.mock('../../../services/isAuthenticated', () => (req, res, next) => {
  return req.session?.userId ? next() : res.status(401).send('Thou shall not pass!')
})

const request = require('supertest')
const user = require('../../../models/user')
const oidc = require('../../../services/oidc')
const writeLog = require('../../../services/writeLog')
const users = require('../../../api/v1/users')
const { buildApp: build, query } = require('../helpers')

const flow = { state: 'the-state', nonce: 'the-nonce', verifier: 'the-verifier' }

// the message travels url-encoded, and asserting on that is unreadable
const errorIn = location => decodeURIComponent(new URL(location, 'https://pils.test').searchParams.get('error') || '')

const buildApp = (session = {}) => build('/users', users, { cookie: {}, ...session })

const claims = { iss: 'https://auth.example.test', sub: 'the-subject' }
const profile = { issuer: 'https://auth.example.test', subject: 'the-subject', username: 'oscar', admin: null }
const account = { _id: 'user-1', username: 'oscar', admin: false }

const findOneResolves = (...values) => {
  values.forEach(value => user.findOne.mockReturnValueOnce(query(value)))
}

beforeEach(() => {
  user.findOne.mockReset()
  user.findOneAndUpdate.mockReset().mockReturnValue(query(account))
  user.create.mockReset().mockResolvedValue(account)

  oidc.enabled.mockReset().mockReturnValue(true)
  oidc.name.mockReset().mockReturnValue('auth.example.test')
  oidc.allowSignup.mockReset().mockReturnValue(true)
  oidc.linkByUsername.mockReset().mockReturnValue(true)
  oidc.redirectUri.mockReset().mockReturnValue('https://pils.example.test/api/v1/users/login/oidc/callback')
  oidc.startFlow.mockReset().mockResolvedValue(flow)
  oidc.authorizationUrl.mockReset().mockResolvedValue('https://auth.example.test/auth?client_id=pils')
  oidc.complete.mockReset().mockResolvedValue(claims)
  oidc.describe.mockReset().mockImplementation(error => String(error?.message || error))
  oidc.profile.mockReset().mockReturnValue(profile)

  writeLog.mockReset()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('GET /users/login/oidc/enabled', () => {
  it('tells the login page what to offer', async () => {
    const { app } = buildApp()
    const res = await request(app).get('/users/login/oidc/enabled')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ enabled: true, name: 'auth.example.test' })
  })

  it('says so when nothing is configured', async () => {
    oidc.enabled.mockReturnValue(false)
    const { app } = buildApp()
    const res = await request(app).get('/users/login/oidc/enabled')

    expect(res.body.enabled).toBe(false)
  })
})

describe('GET /users/login/oidc', () => {
  it('redirects to the issuer and keeps the flow in the session', async () => {
    const { app, session } = buildApp()
    const res = await request(app).get('/users/login/oidc')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('https://auth.example.test/auth?client_id=pils')
    expect(session.oidc).toMatchObject(flow)
  })

  it('remembers unless the browser asked it not to', async () => {
    const { app, session } = buildApp()
    await request(app).get('/users/login/oidc')
    expect(session.oidc.remember).toBe(true)

    const other = buildApp()
    await request(other.app).get('/users/login/oidc?remember=false')
    expect(other.session.oidc.remember).toBe(false)
  })

  it('keeps a local redirect for afterwards', async () => {
    const { app, session } = buildApp()
    await request(app).get('/users/login/oidc?redirect=%2Fusers%2Fuser-1')

    expect(session.oidc.redirect).toBe('/users/user-1')
  })

  it.each([
    ['an absolute url', 'https://evil.test/steal'],
    ['a protocol-relative url', '//evil.test/steal'],
    ['a backslash url', '/\\evil.test/steal'],
    ['a bare word', 'discounts']
  ])('drops %s rather than redirecting off site', async (_, redirect) => {
    const { app, session } = buildApp()
    await request(app).get(`/users/login/oidc?redirect=${encodeURIComponent(redirect)}`)

    expect(session.oidc.redirect).toBe('')
  })

  it('is not there when single sign-on is off', async () => {
    oidc.enabled.mockReturnValue(false)
    const { app } = buildApp()
    const res = await request(app).get('/users/login/oidc')

    expect(res.status).toBe(404)
    expect(oidc.startFlow).not.toHaveBeenCalled()
  })

  it('answers 502 when the issuer cannot be reached', async () => {
    oidc.authorizationUrl.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'))
    const { app } = buildApp()
    const res = await request(app).get('/users/login/oidc')

    expect(res.status).toBe(502)
  })
})

describe('GET /users/login/oidc/callback', () => {
  const started = (overrides = {}) => ({ oidc: { ...flow, remember: true, redirect: '', ...overrides } })

  const callback = (app, query = 'code=the-code&state=the-state') =>
    request(app).get(`/users/login/oidc/callback?${query}`)

  it('signs the account in and sends the page back to itself', async () => {
    findOneResolves(account)
    const { app, session } = buildApp(started())
    const res = await callback(app)

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/login?oidc=1')
    expect(session.userId).toBe('user-1')
    expect(session.username).toBe('oscar')
  })

  it('carries the remembered redirect through', async () => {
    findOneResolves(account)
    const { app } = buildApp(started({ redirect: '/users/user-1' }))
    const res = await callback(app)

    expect(res.headers.location).toBe('/login?oidc=1&redirect=%2Fusers%2Fuser-1')
  })

  it('hands the whole flow to the library to check and exchange', async () => {
    findOneResolves(account)
    const { app } = buildApp(started())
    await callback(app)

    expect(oidc.complete).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ code: 'the-code' }) }),
      expect.objectContaining({ state: 'the-state', nonce: 'the-nonce', verifier: 'the-verifier' })
    )
  })

  it('drops the flow so a replayed callback finds nothing', async () => {
    findOneResolves(account)
    const { app, session } = buildApp(started())
    await callback(app)

    expect(session.oidc).toBeUndefined()
  })

  it('regenerates the session before writing the account into it', async () => {
    findOneResolves(account)
    const regenerate = jest.fn(cb => cb())
    const { app } = buildApp({ ...started(), regenerate })
    await callback(app)

    expect(regenerate).toHaveBeenCalled()
  })

  it('turns a refusal from the library into a message on the login page', async () => {
    oidc.complete.mockRejectedValue(new Error('unexpected "state" response parameter value'))
    const { app, session } = buildApp(started())
    const res = await callback(app, 'code=the-code&state=someone-elses-state')

    expect(errorIn(res.headers.location)).toMatch(/not accepted/)
    expect(session.userId).toBeUndefined()
  })

  it('logs the reason the library gave rather than a generic wrapper', async () => {
    oidc.complete.mockRejectedValue(new Error('unexpected JWT "aud" claim value'))
    const { app } = buildApp(started())
    await callback(app)

    expect(writeLog).toHaveBeenCalledWith(
      expect.stringContaining('unexpected JWT "aud" claim value'), 'Warning', 'Users', expect.anything()
    )
  })

  it('refuses a callback with no flow in the session', async () => {
    const { app } = buildApp()
    const res = await callback(app)

    expect(errorIn(res.headers.location)).toMatch(/took too long/)
    expect(oidc.complete).not.toHaveBeenCalled()
  })

  it('reports what the issuer refused', async () => {
    const { app } = buildApp(started())
    const res = await callback(app, 'error=access_denied&state=the-state')

    expect(errorIn(res.headers.location)).toMatch(/refused/)
    expect(writeLog).toHaveBeenCalledWith(
      expect.stringContaining('access_denied'), 'Warning', 'Users', expect.anything()
    )
  })

  // anyone can walk a browser into the callback, so both of these are theirs
  // to choose and neither belongs in the log as it arrived
  it('keeps the free text the caller sent out of the log', async () => {
    const { app } = buildApp(started())
    const description = encodeURIComponent('ok\nInfo Users forged line')
    await callback(app, `error=access_denied&error_description=${description}`)

    expect(writeLog).not.toHaveBeenCalledWith(
      expect.stringContaining('forged line'), expect.anything(), expect.anything(), expect.anything()
    )
  })

  it('cuts an error code down to what the spec allows', async () => {
    const { app } = buildApp(started())
    await callback(app, `error=${encodeURIComponent('bad code\nInfo Users forged')}`)

    const [message] = writeLog.mock.calls[0]
    expect(message).toContain('badcode')
    expect(message).not.toContain('\n')
  })

  it('does not sign anyone in when the id_token fails to verify', async () => {
    oidc.complete.mockRejectedValue(new Error('JWS signature verification failed'))
    const { app, session } = buildApp(started())
    const res = await callback(app)

    expect(errorIn(res.headers.location)).toMatch(/not accepted/)
    expect(session.userId).toBeUndefined()
  })
})

describe('linking a federated account', () => {
  const started = () => ({ oidc: { ...flow, remember: true, redirect: '' } })

  const callback = app => request(app).get('/users/login/oidc/callback?code=the-code&state=the-state')

  it('finds the account by subject rather than by name', async () => {
    findOneResolves(account)
    const { app } = buildApp(started())
    await callback(app)

    expect(user.findOne).toHaveBeenCalledTimes(1)
    expect(user.findOne).toHaveBeenCalledWith({
      'oidc.subject': { $eq: 'the-subject' },
      'oidc.issuer': { $eq: 'https://auth.example.test' }
    })
  })

  it('claims an existing username on its first federated sign-in', async () => {
    findOneResolves(null, account)
    const { app } = buildApp(started())
    await callback(app)

    expect(user.findOne).toHaveBeenNthCalledWith(2, { username: { $eq: 'oscar' } })
    expect(user.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user-1' },
      { $set: { oidc: { issuer: 'https://auth.example.test', subject: 'the-subject' } } },
      { new: true }
    )
  })

  // a username claim is whatever the issuer lets the subject call itself, so
  // renaming upstream to an admin's name would otherwise hand the account over
  it('refuses to claim an existing username unless the deployment allows it', async () => {
    oidc.linkByUsername.mockReturnValue(false)
    findOneResolves(null, { ...account, admin: true })
    const { app, session } = buildApp(started())
    const res = await callback(app)

    expect(user.findOneAndUpdate).not.toHaveBeenCalled()
    expect(user.create).not.toHaveBeenCalled()
    expect(errorIn(res.headers.location)).toMatch(/not accepted/)
    expect(session.userId).toBeUndefined()
  })

  it('still creates an account for a free username with claiming off', async () => {
    oidc.linkByUsername.mockReturnValue(false)
    findOneResolves(null, null)
    const { app, session } = buildApp(started())
    await callback(app)

    expect(user.create).toHaveBeenCalled()
    expect(session.userId).toBe('user-1')
  })

  it('refuses to claim a username already linked to another subject', async () => {
    findOneResolves(null, { ...account, oidc: { issuer: profile.issuer, subject: 'someone-else' } })
    const { app, session } = buildApp(started())
    const res = await callback(app)

    expect(user.findOneAndUpdate).not.toHaveBeenCalled()
    expect(errorIn(res.headers.location)).toMatch(/not accepted/)
    expect(session.userId).toBeUndefined()
  })

  it('leaves admin alone when the issuer has no say', async () => {
    findOneResolves(account)
    const { app } = buildApp(started())
    await callback(app)

    expect(user.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('admin')
  })

  it('syncs admin from the configured group', async () => {
    oidc.profile.mockReturnValue({ ...profile, admin: true })
    findOneResolves(account)
    const { app } = buildApp(started())
    await callback(app)

    expect(user.findOneAndUpdate.mock.calls[0][1].$set.admin).toBe(true)
  })

  it('takes admin away again when the group no longer says so', async () => {
    oidc.profile.mockReturnValue({ ...profile, admin: false })
    findOneResolves({ ...account, admin: true })
    const { app } = buildApp(started())
    await callback(app)

    expect(user.findOneAndUpdate.mock.calls[0][1].$set.admin).toBe(false)
  })

  it('creates an account for a subject nobody has seen', async () => {
    findOneResolves(null, null)
    const { app, session } = buildApp(started())
    await callback(app)

    expect(user.create).toHaveBeenCalledWith({
      username: 'oscar',
      admin: false,
      oidc: { issuer: 'https://auth.example.test', subject: 'the-subject' }
    })
    expect(session.userId).toBe('user-1')
  })

  it('refuses an unknown subject when signup is off', async () => {
    oidc.allowSignup.mockReturnValue(false)
    findOneResolves(null, null)
    const { app, session } = buildApp(started())
    const res = await callback(app)

    expect(user.create).not.toHaveBeenCalled()
    expect(errorIn(res.headers.location)).toMatch(/not accepted/)
    expect(session.userId).toBeUndefined()
  })
})

describe('GET /users/session', () => {
  it('hands the frontend back what the session holds', async () => {
    const { app } = buildApp({ userId: 'user-1', username: 'oscar', admin: true })
    const res = await request(app).get('/users/session')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ _id: 'user-1', username: 'oscar', admin: true })
  })

  it('is closed to anyone without a session', async () => {
    const { app } = buildApp()
    const res = await request(app).get('/users/session')

    expect(res.status).toBe(401)
  })
})
