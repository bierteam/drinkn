const express = require('express')
const router = express.Router()

const discounts = require('./discounts')
router.use(discounts)

const store = require('./stores')
router.use(store)

// TODO create a possibillity for manual import
// const dbImport = require('./dbImport')
// router.use(dbImport)

const users = require('./users')
router.use('/users', users)

const account = require('./account')
router.use('/account', account)

const logging = require('./logging')
router.use('/logging', logging)

module.exports = router
