const express = require('express');
const bodyParser = require('body-parser');
const app = express()


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

const MongoClient = require('mongodb').MongoClient;
const url = "ENTER DB CONNECTION STRING";

const routes = require('./routes/index');
app.use('/', routes);


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})