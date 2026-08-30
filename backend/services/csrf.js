const { csrfSync } = require('csrf-sync')

// Synchroniser tokens rather than double submit: there is already a
// mongo-backed session to keep the token in, so nothing new has to be stored
// or signed.
//
// sameSite on the session cookie is the first line of defence and stops the
// classic cross-site form post on its own. This is the second, for the cases
// sameSite does not cover -- an older browser, or a same-site subdomain that
// is not as trusted as this one.
const { generateToken, csrfSynchronisedProtection } = csrfSync({
  // axios sets this from the interceptor in the frontend's Api.js
  getTokenFromRequest: req => req.headers['x-csrf-token']
})

// GET, HEAD and OPTIONS are skipped by the library: they are not supposed to
// change anything, and the token endpoint itself has to stay reachable.
module.exports = { generateToken, protect: csrfSynchronisedProtection }
