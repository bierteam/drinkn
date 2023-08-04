if (process.env.NODE_ENV !== 'production') require('dotenv').config() // use the .env file for this
require('./setup')
const connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`

const mongoose = require('mongoose')

mongoose.connect(connectionString, { useNewUrlParser: true })
const db = mongoose.connection

const dbImport = require('./services/dbImport')

db.on('error', console.error.bind(console, 'connection error:'))

dbImport()
