const express = require('express')
const request = require('supertest')
const rateLimit = require('../../../services/rateLimit')

// touching NODE_ENV would leak into the next file the worker runs
const active = limit => rateLimit.build(limit, () => false)

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

describe('the limits the routes are wired with', () => {
  it('keeps credential checks far tighter than ordinary reads', () => {
    expect(rateLimit.AUTH_MAX).toBeLessThan(rateLimit.API_MAX)
    expect(rateLimit.AUTH_MAX).toBeGreaterThan(2)
  })
})

describe('under test', () => {
  it('lets everything through, so a suite is not throttled partway', async () => {
    const codes = await hammer(buildApp(rateLimit.auth, '203.0.113.1'), rateLimit.AUTH_MAX + 5)

    expect(codes.every(code => code === 200)).toBe(true)
  })
})

describe('a live limiter', () => {
  it('allows the budget, then refuses', async () => {
    const codes = await hammer(buildApp(active(3), '203.0.113.10'), 5)

    expect(codes).toEqual([200, 200, 200, 429, 429])
  })

  it('budgets per client, so one caller cannot lock everyone out', async () => {
    const limiter = active(3)
    await hammer(buildApp(limiter, '203.0.113.11'), 5)

    const codes = await hammer(buildApp(limiter, '203.0.113.12'), 3)

    expect(codes).toEqual([200, 200, 200])
  })

  it('buckets an IPv6 caller by subnet, not by exact address', async () => {
    const limiter = active(3)
    await hammer(buildApp(limiter, '2001:db8:1234:5678::1'), 5)

    const codes = await hammer(buildApp(limiter, '2001:db8:1234:5678::99ff'), 2)

    expect(codes.every(code => code === 429)).toBe(true)
  })

  it('keeps a different IPv6 subnet on its own budget', async () => {
    const limiter = active(3)
    await hammer(buildApp(limiter, '2001:db8:1234:5678::1'), 5)

    const codes = await hammer(buildApp(limiter, '2001:db8:9999::1'), 2)

    expect(codes).toEqual([200, 200])
  })

  it('falls back to the socket address when no forwarded ip was set', async () => {
    const app = express()
    app.get('/thing', active(3), (req, res) => res.send('ok'))

    const res = await request(app).get('/thing')

    expect(res.status).toBe(200)
  })
})
