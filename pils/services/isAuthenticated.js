const devmode = process.env.DEVMODE || false

const isAuthenticated = (req, res, next) => {
  if (devmode) {
    console.log('Responding to user because of devmode')
    return next()
  }

  if (req.session?.userId) {
    return next()
  } else {
    return res.status(401).send('Thou shall not pass!')
  }
}

module.exports = isAuthenticated
