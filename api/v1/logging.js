const express = require('express')
const router = express.Router()
const isAdmin = require('../../services/isAdmin')
const logging = require('../../models/log')
const writeLog = require('../../services/writeLog')
const context = 'Logging'

router.get('/', isAdmin, function (req, res) {
  logging.find({}).select('message date context type ').sort({ date: 'descending' }).exec(function (err, result) {
    if (err) console.error(err)
    res.json(result)
  })
})
router.delete('/', isAdmin, function (req, res) { // temporary dev function
  logging.remove({}, function (err) {
    if (err) {
      console.err(err)
      writeLog(err, 'Error', context)
      res.sendStatus(500)
    } else {
      res.status(200).send('Logs succesfully deleted')
    }
    writeLog(`${req.session.userId} deleted the logs.`, 'Warning', context)
  })
})

module.exports = router
