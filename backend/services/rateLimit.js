const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')

const WINDOW_MS = 15 * 60 * 1000

// anything that checks a credential; signing in honestly needs few attempts
const AUTH_MAX = 10

// signed-in reads and writes, loose enough to stay invisible
const API_MAX = 100

const keyGenerator = req => ipKeyGenerator(req.realIp || req.ip)

const skipInTests = () => process.env.NODE_ENV === 'test'

const build = (limit, skip = skipInTests) => rateLimit({
  windowMs: WINDOW_MS,
  limit,
  keyGenerator,
  skip,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests, try again shortly.'
})

module.exports = {
  auth: build(AUTH_MAX),
  api: build(API_MAX),
  // exported so tests can build a live limiter without touching NODE_ENV
  build,
  WINDOW_MS,
  AUTH_MAX,
  API_MAX
}
