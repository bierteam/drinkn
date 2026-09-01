const express = require('express')
const router = express.Router()

const discounts = require('./discounts')
router.use(discounts)

const products = require('./products')
router.use(products)

const store = require('./stores')
router.use(store)

// reachable without a token, since it is what hands one out
const csrf = require('../../services/csrf')
router.get('/csrf', (req, res) => res.json({ token: csrf.generateToken(req) }))

const users = require('./users')
router.use('/users', users)

const account = require('./account')
router.use('/account', account)

const logging = require('./logging')
router.use('/logging', logging)

module.exports = router
