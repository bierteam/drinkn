if (process.env.NODE_ENV !== 'production') require('dotenv').config() // use the .env file for this
const createError = require('http-errors')
const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const app = express()

// app.use(logger('combined'))
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

const v2 = require('./routes')
app.use('/api/v2/auth', v2)

const health = require('./routes/health')
app.use('/health', health)

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
  res.render('error')
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => console.log(`Auth api listening on port ${port}!`))
