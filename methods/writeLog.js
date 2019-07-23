const logger = require('../models/log')
const moment = require('moment')
moment.locale('nl')

const writeLog = (message, type, context) => {
  let logMessage = {
    message: message,
    date: moment().toDate(),
    type: type,
    context: context
  }
  logger.create(logMessage, function (err, user) {
    if (err) {
      console.error(err)
    }
  })
}

module.exports = writeLog
