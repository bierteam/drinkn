const joinObjects = (primaryObjects, secundaryObjects, firstKey, secondKey) => {
  /*
  This part will change:
  {
    uid: '123',
    name: 'test'
  }

  Into:
  '123': {
    uid: '123',
    name: 'test'
  }
  */
  let preparedObject = {}
  for (let object in secundaryObjects) {
    preparedObject[secundaryObjects[object][secondKey]] = secundaryObjects[object]
  }

  for (let object in primaryObjects) {
    //  Maps The second object to the primary Object
    let mappedObject = preparedObject[primaryObjects[object][firstKey]]
    // Dynamically adds each key of the mapped secundary object to the primary object
    for (let key in mappedObject) {
      primaryObjects[object][key] = mappedObject[key]
    }
  }
  console.log(primaryObjects)
}

module.exports = joinObjects