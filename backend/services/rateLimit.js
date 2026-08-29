const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')

const WINDOW_MS = 15 * 60 * 1000

// Anything that checks a credential. Tight, because these are the routes worth
// guessing at, and a person signing in legitimately needs very few attempts.
const AUTH_MAX = 10

// Signed-in routes that read or write a record. Loose enough to stay invisible
// in normal use.
const API_MAX = 100

// Behind Cloudflare and traefik, so the client is whatever set the ip on the
// request, not the socket address -- otherwise every caller shares the
// proxy's ip and one of them exhausts the budget for all.
//
// ipKeyGenerator buckets IPv6 by its /64 rather than the exact address. A
// single subscriber is handed a whole /64, so keying on the full address
// would let them walk to a fresh one for every attempt.
const keyGenerator = req => ipKeyGenerator(req.realIp || req.ip)

// The counter is process-wide, so a suite exercising a route more than `max`
// times would start seeing 429s partway through.
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
  // exported so the tests can exercise a live limiter without reaching for
  // NODE_ENV, which is process-wide and leaks between test files
  build,
  WINDOW_MS,
  AUTH_MAX,
  API_MAX
}
