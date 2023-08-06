const logger = require('../models/log')
const moment = require('moment')
moment.locale('nl')

const writeLog = async (message, type, context, ip) => {
  try {
    const logMessage = {
      message: message.toString(),
      date: moment().toDate(),
      type: type.toString(),
      context: context.toString(),
      ip: ip.toString()
    }
    console.log(logMessage.message)
    await logger.create(logMessage)
  } catch (err) {
    console.error(err)
  }
}

module.exports = writeLog
