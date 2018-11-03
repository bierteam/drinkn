const MongoClient = require('mongodb').MongoClient
const config = require('./../config')
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`
const scrape = require('./scrape')
const processData = require('./processData')

const dbImport = () => {
  scrape().then((array) => {
    let cleanedData = processData(array.data)
    MongoClient.connect(connectionString, { useNewUrlParser: true }, function (err, client) {
      if (err) throw err
      let dbo = client.db(config.db.name)
      dbo.collection(config.db.collection).insertMany(cleanedData, function (err, res) {
        if (err) throw err
        console.log(`${array.data.length} document(s) inserted in ${config.db.host}:${config.db.name}/${config.db.collection}`)
      })
      client.close()
    })
  })
}

module.exports = dbImport
