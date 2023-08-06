const devmode = process.env.DEVMODE || false

const isAdmin = (req, res, next) => {
  if (devmode) {
    console.log('granting admin previleges because of devmode')
    return next()
  }
  if (req.session?.userId) {
    if (!req.session.admin) {
      res.status(403).send('You are not an admin!')
    } else {
      return next()
    }
  } else {
    res.status(401).send('Thou shall not pass!')
  }
}

module.exports = isAdmin
