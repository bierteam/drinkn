const otplib = require('otplib')
// const user = require('../models/user')

otplib.authenticator.options = {
  window: 1,
  algorithm: 'SHA256'
}

const generate = (req) => {
  const result = {}
  result.secret = otplib.authenticator.generateSecret()
  result.uri = uri(req.session.username, req.host, result.secret, req.headers.host)
  req.session.secret = result.secret

  return result
}

const check = (req) => {
  const token = req.body.user.otp
  const secret = req.session.secret
  return otplib.authenticator.check(token, secret)
}

const uri = (user, service, secret, imageUri) => {
  return `otpauth://totp/${service}:${user}?secret=${secret}&algorithm=SHA256&digits=6&period=30&image=${imageUri}/favicon.ico`
}

// const userDetails = () => {
//   return new Promise((resolve) => {
//     const _id = req.session._id
//     user.findOne({ _id }).exec(async function (err, result) {
//       if (err) {
//         console.error(err)
//       } else resolve(result)
//     })
//   })
// }

module.exports = { generate, check }
