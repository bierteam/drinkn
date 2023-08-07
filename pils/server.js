if (process.env.NODE_ENV !== 'production') require('dotenv').config() // use the .env file for this
require('./setup')

let mongoProtocol
if (process.env.NO_SRV) {
  mongoProtocol = 'mongodb'
} else {
  mongoProtocol = 'mongodb+srv'
}

const connectionString = `${mongoProtocol}://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`

const express = require('express')
const history = require('connect-history-api-fallback')
const bodyParser = require('body-parser')
const session = require('express-session')
const helmet = require('helmet')
const app = express()
const cors = require('cors')

const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const user = require('./models/user')
const writeLog = require('./services/writeLog')

mongoose.connect(connectionString)
const db = mongoose.connection

// https://github.com/bripkens/connect-history-api-fallback
// https://router.vuejs.org/guide/essentials/history-mode.html
app.use(history())

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
// security settings
app.use(function (req, res, next) { // Set client ip
  req.realIp = req.header('cf-connecting-ip') || req.header('x-forwarded-for') || req.connection.remoteAddress
  next()
})
app.use(cors()) // Resolves "No 'Access-Control-Allow-Origin' header is present" error
app.use(helmet({
  contentSecurityPolicy: false
}))
app.set('trust proxy', 1) // trust first proxy

const options = {
  secret: process.env.APPSECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: connectionString
  })
}
app.use(session(options))

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Succesfully connected to database')
})

// check for (and create) default account if enabled
if (process.env.DEFAULT_USER && process.env.DEFAULT_PASS) {
  const defaultAccount = {
    username: process.env.DEFAULT_USER,
    password: process.env.DEFAULT_PASS,
    admin: true
  }
  const username = defaultAccount.username
  defaultAccount.admin = true
  const createDefault = async () => {
    try {
      const result = await user.findOne({ username })

      if (!result) {
        await user.create(defaultAccount)
        console.log('Default user account has been created')
        writeLog('Default user account has been created', 'Info', 'Server')
      }
    } catch (err) {
      console.error(err)
    }
  }
  createDefault()
}

const api = require('./api')
app.use('/api', api)

if (process.env.NODE_ENV !== 'production') {
  app.use(express.static('../pils-frontend/public'))
}

const port = Number(process.env.PORT) || 3000
app.listen(port, function () {
  console.log(`Beer backend running on port ${port}!`)
})
