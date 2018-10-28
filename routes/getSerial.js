const config = require('./../config')
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`

const getSerial = () => {
  MongoClient.connect(connectionString, { useNewUrlParser: true }, function (err, client) {
    if (err) throw err
    let dbo = client.db(config.db.name)
    dbo.collection(config.db.sCollection).findOne({}, function (err, res) {
      if (err) throw err
    })
    client.close()
    let serial = null // debugging
    return serial
  })
}

module.exports = getSerial
