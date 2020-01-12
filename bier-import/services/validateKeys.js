const writeLog = require('./writeLog')
const context = 'Import'
const validateKeys = (input, mandatoryKeys) => {
  for (const key of mandatoryKeys) {
    if (input[key] === undefined || input[key] === null || input[key] === '') {
      writeLog(`Object ${input.uid} has no value for ${key}`, 'Warning', context)
      return false
    }
  }
}

module.exports = validateKeys
