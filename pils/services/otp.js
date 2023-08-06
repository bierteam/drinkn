const { authenticator } = require('otplib')

authenticator.options = {
  window: 1,
  algorithm: 'sha1'
}

const generate = (req) => {
  const result = {}
  result.secret = authenticator.generateSecret()
  result.uri = uri(req.session.username, req.hostname, result.secret, req.headers.host)
  req.session.secret = result.secret

  return result
}

const check = (token, secret) => {
  return authenticator.check(token, secret)
}

const uri = (user, service, secret, imageUri) => {
  return `otpauth://totp/${service}:${user}?secret=${secret}&algorithm=SHA1&digits=6&period=30&image=${imageUri}/favicon.ico`
}

module.exports = { generate, check }
