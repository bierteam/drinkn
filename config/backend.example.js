/*
Make a copy of this file and name it config.js
Fill in the details and have fun!
*/
const backend = {
  app: {
    port: 3000,
    secret: '',
    devmode: false,
    defaultAccount: {
      autoCreate: true,
      username: '',
      password: ''
    }
  },
  db: {
    host: '',
    username: '',
    password: '',
    name: ''
  },
  scraper: {
    uri: ''
  }
}

module.exports = backend
