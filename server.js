const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const config = require('./config')
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`
const helmet = require('helmet')
const user = require('./models/user')

mongoose.connect(connectionString, { useNewUrlParser: true })
const db = mongoose.connection

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

// security settings
app.disable('x-powered-by')
app.use(helmet.frameguard())
app.use(helmet.noCache())

app.use(session({
  secret: config.app.secret,
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: db }),
  cookie: {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // store 30 days
  }
}))

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Succesfully connected to database')
})

// check for (and create) default account if enabled
if (config.app.defaultAccount.autoCreate) {
  const defaultAccount = config.app.defaultAccount
  const username = defaultAccount.username
  const createDefault = () => {
    user.findOne({ username }, function (err, result) {
      if (err) {
        console.error(err)
      } else if (!result) {
        user.create(defaultAccount, function (err, result) {
          if (err) {
            console.error(err)
          } else {
            console.log('Default user account has been created')
          }
        })
      }
    })
  }
  createDefault()
}

const routes = require('./routes/index')
app.use('/', routes)

app.listen(config.app.port, function () {
  console.log(`Beer app running on port ${config.app.port}!`)
})
