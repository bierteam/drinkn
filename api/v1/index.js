const express = require('express')
const router = express.Router()

const aanbieding = require('./aanbieding')
router.use(aanbieding)

const store = require('./stores')
router.use(store)

const dbImport = require('./dbImport')
router.use(dbImport)

const users = require('./users')
router.use('/users', users)

const account = require('./account')
router.use('/account', account)

const logging = require('./logging')
router.use('/logging', logging)

module.exports = router
