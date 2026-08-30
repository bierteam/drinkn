const { csrfSync } = require('csrf-sync')

// synchroniser tokens: there is already a session to keep them in
const { generateToken, csrfSynchronisedProtection } = csrfSync({
  // axios sets this from the interceptor in the frontend's Api.js
  getTokenFromRequest: req => req.headers['x-csrf-token']
})

// GET, HEAD and OPTIONS are skipped: the token endpoint has to stay reachable
module.exports = { generateToken, protect: csrfSynchronisedProtection }
