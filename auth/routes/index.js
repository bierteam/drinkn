const express = require('express')
const router = express.Router()

const check = require('./check')
router.use('/check', check)
const login = require('./login')
router.use('/login', login)
const refresh = require('./refresh')
router.use('/refresh', refresh)
const logout = require('./logout')
router.use('/logout', logout)
const register = require('./register')
router.use('/register', register)

module.exports = router
