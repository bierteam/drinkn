const config = require('../config')
const devmode = config.app.devmode

const isAuthenticated = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      return next()
    } else {
      res.status(403)
      res.send('Thou shall not pass!')
    }
  } else {
    return next()
  }
}
module.exports = isAuthenticated
