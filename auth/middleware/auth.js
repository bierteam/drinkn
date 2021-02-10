const jwt = require('jsonwebtoken')
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
  try {
    let token = String
    if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '')
    } else {
      throw new Error()
    }
    const user = jwt.verify(token, process.env.JWTSECRET)
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
