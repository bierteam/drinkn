const express = require('express')
const request = require('supertest')
const rateLimit = require('../../../services/rateLimit')

// the limiter counts per key, so each test uses its own client ip and starts
// from a clean budget without having to reach into the store
const buildApp = (limiter, ip) => {
  const app = express()
  app.use((req, res, next) => {
    req.realIp = ip
    next()
  })
  app.get('/thing', limiter, (req, res) => res.send('ok'))
  return app
}

const hammer = async (app, times) => {
  const codes = []
  for (let i = 0; i < times; i++) {
    const res = await request(app).get('/thing')
    codes.push(res.status)
  }
  return codes
}

const { NODE_ENV } = process.env

afterEach(() => {
  process.env.NODE_ENV = NODE_ENV
})

describe('in tests', () => {
  it('lets everything through, so a suite is not throttled partway', async () => {
    const codes = await hammer(buildApp(rateLimit.auth, '203.0.113.1'), 25)

    expect(codes.every(code => code === 200)).toBe(true)
  })
})

describe('auth limiter', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production'
  })

  it('allows a workable number of attempts, then refuses', async () => {
    const codes = await hammer(buildApp(rateLimit.auth, '203.0.113.10'), 12)

    expect(codes.filter(c => c === 200)).toHaveLength(10)
    expect(codes.filter(c => c === 429)).toHaveLength(2)
  })

  it('budgets per client, so one caller cannot lock everyone out', async () => {
    const noisy = buildApp(rateLimit.auth, '203.0.113.11')
    await hammer(noisy, 12)

    const other = buildApp(rateLimit.auth, '203.0.113.12')
    const codes = await hammer(other, 3)

    expect(codes).toEqual([200, 200, 200])
  })

  it('buckets an IPv6 caller by subnet, not by exact address', async () => {
    // a subscriber gets a whole /64, so keying on the full address would let
    // them take a fresh one for each attempt
    const first = buildApp(rateLimit.auth, '2001:db8:1234:5678::1')
    await hammer(first, 12)

    const sameSubnet = buildApp(rateLimit.auth, '2001:db8:1234:5678::99ff')
    const codes = await hammer(sameSubnet, 2)

    expect(codes.every(code => code === 429)).toBe(true)
  })

  it('keeps a different IPv6 subnet on its own budget', async () => {
    const other = buildApp(rateLimit.auth, '2001:db8:9999:0000::1')

    const codes = await hammer(other, 2)

    expect(codes).toEqual([200, 200])
  })

  it('falls back to the socket address when no forwarded ip was set', async () => {
    const app = express()
    app.get('/thing', rateLimit.auth, (req, res) => res.send('ok'))

    const res = await request(app).get('/thing')

    expect(res.status).toBe(200)
  })
})

describe('api limiter', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production'
  })

  it('is looser than the auth one, so normal browsing never trips it', async () => {
    const codes = await hammer(buildApp(rateLimit.api, '203.0.113.20'), 20)

    expect(codes.every(code => code === 200)).toBe(true)
  })
})
