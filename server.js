const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.use(session({
  resave: true,
  saveUninitialized: false
}));

const db = mongoose.connection;


db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Succesfully connected to database")
});

const routes = require('./routes/index');
app.use('/', routes);


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
