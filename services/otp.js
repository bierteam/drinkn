const otplib = require('otplib')

otplib.authenticator.options = {
  window: 1,
  algorithm: 'SHA1'
}

const generate = (req) => {
  const result = {}
  result.secret = otplib.authenticator.generateSecret()
  result.uri = uri(req.session.username, req.hostname, result.secret, req.headers.host)
  req.session.secret = result.secret

  return result
}

const check = (token, secret) => {
  return otplib.authenticator.check(token, secret)
}

const uri = (user, service, secret, imageUri) => {
  return `otpauth://totp/${service}:${user}?secret=${secret}&algorithm=SHA1&digits=6&period=30&image=${imageUri}/favicon.ico`
}

module.exports = { generate, check }
