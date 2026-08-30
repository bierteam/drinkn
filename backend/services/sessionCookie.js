const production = process.env.NODE_ENV === 'production'

// one definition: a browser only clears a cookie whose attributes match
const cookie = {
  // no certificate in development, so a secure cookie would never be stored
  secure: production,
  httpOnly: true,
  // same host, so a cross-site request has no business carrying this
  sameSite: 'lax',
  path: '/'
}

module.exports = { cookie, production }
