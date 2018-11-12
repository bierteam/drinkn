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
  stores: {
    'Agrimarkt': 'Agrimarkt',
    'albert heijn': 'Albert Heijn',
    'Attent': 'Attent',
    'Boni supermarkt': 'Boni',
    "Boon's Markt": "Boon's markt",
    'Coop supermarkt': 'Coop',
    'coop compact': 'Coop compact',
    'Deen supermarkt': 'Deen',
    'dekamarkt ': 'DekaMarkt',
    'Dirckiii slijterij': 'DirckIII',
    'Dirk supermarkt': 'Dirk',
    'Drankdozijn': 'DrankDozijn',
    'EkoPlaza logo': 'EkoPlaza',
    'EMTE': 'Emté',
    'gall en gall': 'Gall&Gall',
    'Hoogvliet': 'Hoogvliet',
    'Jan Linders': 'Jan Linders',
    'makro': 'Makro',
    'MCD': 'MCD',
    'Mitra slijterij': 'Mitra',
    'Nettorama ': 'Nettorama ',
    'Plus Logo': 'Plus',
    'Poiesz': 'Poiesz',
    'Sligro': 'Sligro',
    'Spar': 'Spar',
    'troefmarkt': 'Troefmarkt',
    'Vomar supermarkt': 'Vomar'
  }
}

module.exports = config
