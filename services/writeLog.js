const logger = require('../models/log')
const moment = require('moment')
moment.locale('nl')

const writeLog = (message, type, context, ip) => {
  const logMessage = {
    message,
    date: moment().toDate(),
    type,
    context,
    ip
  }
  logger.create(logMessage, function (err, user) {
    if (err) {
      console.error(err)
    }
  })
}

module.exports = writeLog
