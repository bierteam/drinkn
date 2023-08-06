const logger = require('../models/log')
const moment = require('moment')
moment.locale('nl')

const writeLog = async (message, type, context, ip) => {
  try {
    const logMessage = {
      message,
      date: moment().toDate(),
      type,
      context,
      ip
    }

    console.log(logMessage.message)

    await logger.create(logMessage)
    console.log('Log message successfully saved to the database.')
  } catch (error) {
    console.error('Error while saving log message:', error)
  }
}

module.exports = writeLog
