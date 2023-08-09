const express = require('express')
const router = express.Router()
const isAdmin = require('../../services/isAdmin')
const logging = require('../../models/log')
const writeLog = require('../../services/writeLog')
const context = 'Logging'

router.get('/', isAdmin, async function (req, res) {
  try {
    const result = await logging.find({})
                            .select('message date context type ip')
                            .limit(10000)
                            .sort({ date: 'descending' })
                            .exec()
    writeLog(`${req.session.username}: ${req.session.userId} requested log data`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/', isAdmin, async function (req, res) {
  try {
    await logging.remove({}).exec()
    res.status(200).send('Logs successfully deleted')
    writeLog(`${req.session.username}: ${req.session.userId} deleted the logs.`, 'Warning', context, req.realIp)
  } catch (err) {
    console.error(err)
    writeLog(err, 'Error', context)
    res.sendStatus(500)
  }
})

module.exports = router
