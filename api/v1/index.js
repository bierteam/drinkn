const express = require('express')
const router = express.Router()
const aanbieding = require('./aanbieding')
const store = require('./stores')

const users = require('./users')
const logging = require('./logging')
const dbImport = require('./dbImport')

router.use('/users', users)
router.use('/logging', logging)
router.use(aanbieding)
router.use(store)
router.use(dbImport)

module.exports = router
