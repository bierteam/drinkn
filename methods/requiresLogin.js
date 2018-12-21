const config = require('./../config')
const devmode = config.app.devmode

const requiresLogin = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      return next()
    } else {
      return res.redirect('/login')
    }
  } else {
    return next()
  }
}
module.exports = requiresLogin
