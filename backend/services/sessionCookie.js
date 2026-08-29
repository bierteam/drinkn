const production = process.env.NODE_ENV === 'production'

// One definition, because a browser only clears a cookie when the attributes
// it is given match the ones it was set with. Logging out with a different
// sameSite or secure flag than the session was created with leaves the cookie
// sitting in the jar.
const cookie = {
  // no certificate in development, so a secure cookie would never be stored
  secure: production,
  // nothing in the browser needs to read the session id
  httpOnly: true,
  // the api and the app share a host, so a cross-site request has no business
  // carrying this. That is what closes CSRF here, rather than a token round
  // trip.
  sameSite: 'lax',
  path: '/'
}

module.exports = { cookie, production }
