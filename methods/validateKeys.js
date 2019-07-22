const validateKeys = (input, mandatoryKeys) => {
  for (let key of mandatoryKeys) {
    if (input[key] === undefined || input[key] === null || input[key] === '') {
      console.log('Empty key found: ' + key)
      return false
    }
  }
}

module.exports = validateKeys
