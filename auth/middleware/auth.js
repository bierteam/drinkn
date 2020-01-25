const jwt = require('jsonwebtoken')
const User = require('../models/user')
const denied = [
  'Denied!',
  'Thou shall not pass!',
  'Oh noes',
  'OOPSIE WOOPSIE!! Uwu We made a fucky wucky!! A wittle fucko boingo! The code monkeys at our headquarters are working VEWY HAWD to fix this!',
  'Oh oh',
  'No.',
  'You can go away now',
  'Nice try'
]

const auth = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '')
  const data = jwt.verify(token, process.env.JWTSECRET)
  try {
    const user = await User.findOne({ _id: data._id, 'tokens.token': token })
    if (!user) {
      throw new Error()
    }
    req.user = user
    req.token = token
    next()
  } catch (error) {
    res.status(401).send({ error: denied[Math.floor(Math.random() * denied.length)] })
  }
}
module.exports = auth
