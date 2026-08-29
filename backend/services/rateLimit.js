const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')

// Behind Cloudflare and traefik, so the client is whatever set the ip on the
// request, not the socket address -- otherwise every caller shares the
// proxy's ip and one of them exhausts the budget for all.
//
// ipKeyGenerator buckets IPv6 by its /64 rather than the exact address. A
// single subscriber is handed a whole /64, so keying on the full address
// would let them walk to a fresh one for every attempt.
const keyGenerator = req => ipKeyGenerator(req.realIp || req.ip)

const limiter = (max, windowMs) => rateLimit({
  windowMs,
  limit: max,
  keyGenerator,
  // the counter is process-wide, so a suite that exercises a route more than
  // `max` times would start seeing 429s partway through
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests, try again shortly.'
})

// Anything that checks a credential. Tight, because these are the routes worth
// guessing at, and a person signing in legitimately needs very few attempts.
const auth = limiter(10, 15 * 60 * 1000)

// Signed-in routes that read or write a record. Loose enough to stay invisible
// in normal use.
const api = limiter(100, 15 * 60 * 1000)

module.exports = { auth, api }
