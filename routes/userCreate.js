const user = require('../models/user')

const createUser = (req, res) => {
  if (req.body.username && req.body.password) {
    let userData = {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email
    }
    console.log(userData)
    user.create(userData, function (err, user) {
      if (err) {
        console.error(err)
      } else {
        console.log(`User account ${userData.username} has been created`)
        return res.redirect('/')
      }
    })
  }
}

module.exports = createUser
