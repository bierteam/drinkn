const devmode = process.env.DEVMODE || false

const isAdmin = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      if (!req.session.admin) {
        res.status(403).send('You are no admin!')
      } else {
        return next()
      }
    } else {
      res.status(401).send('Thou shall not pass!')
    }
  } else {
    console.log('granting admin previleges because of devmode')
    return next()
  }
}

module.exports = isAdmin
