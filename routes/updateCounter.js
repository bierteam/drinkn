const config = require("./../config");
const connectionString = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.host}/${config.db.name}`;

const updateCounter = () => {
  MongoClient.connect(connectionString,{ useNewUrlParser: true }, function(err, client) {
    if (err) throw err;
    let dbo = client.db(config.db.name);

    dbo.collection(config.db.sCollection).findOne({}).toArray(function(err, result) {
      if (err) throw err;
      result++
      dbo.collection(config.db.sCollection).updateOne(result, function(err, res) {
        if (err) throw err;
      });
    });
    client.close();
  });
};

module.exports = updateCounter;
