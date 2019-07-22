const express = require('express')
const router = express.Router()
const isAuthenticated = require('../../methods/isAuthenticated')
const logging = require('../../models/log')

router.get('/logs', isAuthenticated, function (req, res) {
  logging.find({}).select('message date context type ').sort({ date: 'ascending' }).exec(function (err, result) {
    if (err) console.error(err)
    res.json(result)
  })
})

module.exports = router
