const config = require('../config')
const devmode = config.app.devmode

const isAuthenticated = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      console.log('isauth1')
      return next()
    } else {
      console.log('isauth2')
      // TODO someting vue friendly here
      return res.redirect('/login')
    }
  } else {
    console.log('isauth3')
    return next()
  }
}
module.exports = isAuthenticated
