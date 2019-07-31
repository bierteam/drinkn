const config = require('../config')
const devmode = config.app.devmode

const isAuthenticated = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      return next()
    } else {
      res.status(403).send('Thou shall not pass!')
    }
  } else {
    console.log('responding to user because of devmode')
    return next()
  }
}
module.exports = isAuthenticated
