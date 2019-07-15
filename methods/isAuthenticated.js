const config = require('../config')
const devmode = config.app.devmode

const isAuthenticated = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      return next()
    } else {
      // send a string to be handled by the client
      res.send('forbidden')
    }
  } else {
    return next()
  }
}
module.exports = isAuthenticated
