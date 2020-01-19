const express = require('express')
const router = express.Router()

const check = require('./check')
router.use('/check', check)

module.exports = router
