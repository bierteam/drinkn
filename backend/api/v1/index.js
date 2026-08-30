const express = require('express')
const router = express.Router()

const discounts = require('./discounts')
router.use(discounts)

const store = require('./stores')
router.use(store)

// Reachable without a token, since it is what hands one out. GET, so the
// protection above lets it through anyway.
const csrf = require('../../services/csrf')
router.get('/csrf', (req, res) => res.json({ token: csrf.generateToken(req) }))

const users = require('./users')
router.use('/users', users)

const account = require('./account')
router.use('/account', account)

const logging = require('./logging')
router.use('/logging', logging)

module.exports = router
