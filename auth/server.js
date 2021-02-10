require('./env-setup')
const createError = require('http-errors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const express = require('express')
const logger = require('morgan')

const app = express()

const health = require('./routes/health') // place health before logging
app.use('/health', health)

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'))
} else {
  app.use(logger('combined'))
}
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
})

const routes = require('./routes')
app.use('/api/v2/auth', routes)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json(err)
})

const port = Number(process.env.PORT) || 3004
app.listen(port, () => console.log(`Auth api listening on port ${port}!`))
