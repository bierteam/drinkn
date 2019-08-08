const config = require('./config')
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`

const express = require('express')
const history = require('connect-history-api-fallback')
const bodyParser = require('body-parser')
const session = require('express-session')
const helmet = require('helmet')
const app = express()
const cors = require('cors')

const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session)
const user = require('./models/user')
const writeLog = require('./services/writeLog')

// Fix mongoose 5.4.1 deprecations
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

mongoose.connect(connectionString, { useNewUrlParser: true })
const db = mongoose.connection

const dbImport = require('./services/dbImport')
const cron = require('node-cron')

// https://github.com/bripkens/connect-history-api-fallback
// https://router.vuejs.org/guide/essentials/history-mode.html
app.use(history())

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
// security settings
app.use(cors()) // Resolves "No 'Access-Control-Allow-Origin' header is present" error
app.use(helmet())
app.use(function (req, res, next) { // Set client ip
  req.ip = req.header('cf-connecting-ip') || req.header('x-forwarded-for') || req.connection.remoteAddress
  next()
})

const options = {
  secret: config.app.secret,
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: db }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // default of 30 days
  }
}
if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  options.cookie.secure = true // serve secure cookies
}

app.use(session(options))
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Succesfully connected to database')
})

// check for (and create) default account if enabled
if (config.app.defaultAccount.autoCreate) {
  const defaultAccount = config.app.defaultAccount
  const username = defaultAccount.username
  defaultAccount.admin = true
  const createDefault = () => {
    user.findOne({ username }, function (err, result) {
      if (err) {
        console.error(err)
      } else if (!result) {
        user.create(defaultAccount, function (err) {
          if (err) {
            console.error(err)
          } else {
            console.log('Default user account has been created')
            writeLog('Default user account has been created', 'Info', 'Server')
          }
        })
      }
    })
  }
  createDefault()
}

cron.schedule('0 9,22 * * *', async () => {
  const timeout = Math.round(Math.random() * 60) * 1000 * 1000
  setTimeout(await dbImport, timeout)
  console.log('Cron: running import in: ' + (timeout / 1000000) + ' minutes.')
  writeLog('Cron: running import in: ' + (timeout / 1000000) + ' minutes.', 'Info', 'Server')
})

const api = require('./api')
app.use('/api', api)

app.listen(config.app.port, function () {
  console.log(`Beer backend running on port ${config.app.port}!`)
})
