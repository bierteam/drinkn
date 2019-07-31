const config = require('../config')
const devmode = config.app.devmode
const user = require('../models/user')

const isAdmin = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      if (!req.session.admin) {
        res.status(403).send('You are no admin!')
      } else {
        return next()
      }
    } else {
      res.status(403).send('Thou shall not pass!')
    }
  } else {
    console.log('granting admin previleges because of devmode')
    return next()
  }
}

module.exports = isAdmin
