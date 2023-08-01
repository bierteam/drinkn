const devmode = process.env.DEVMODE || false

const isAuthenticated = (req, res, next) => {
  if (!devmode) {
    if (req.session && req.session.userId) {
      return next()
    } else {
      res.status(401).send('Thou shall not pass!')
    }
  } else {
    console.log('responding to user because of devmode')
    return next()
  }
}
module.exports = isAuthenticated
