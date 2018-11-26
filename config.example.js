/*
Make a copy of this file and name it config.js
Fill in the details and have fun!
*/
const config = {
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
  },
  stores: [
    'Agrimarkt',
    'Albert Heijn',
    'Attent',
    'Boni',
    `Boon's markt`,
    'Coop',
    'Coop compact',
    'Deen',
    'DekaMarkt',
    'DirckIII',
    'Dirk',
    'DrankDozijn',
    'EkoPlaza',
    'Emté',
    'Gall&Gall',
    'Hoogvliet',
    'Jan Linders',
    'Makro',
    'MCD',
    'Mitra',
    'Nettorama ',
    'Plus',
    'Poiesz',
    'Sligro',
    'Spar',
    'Troefmarkt',
    'Vomar'
  ]
}

module.exports = config
