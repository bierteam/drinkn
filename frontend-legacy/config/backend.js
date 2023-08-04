const backend = {
  app: {
    port: 3000,
    secret: 'KoudPils',
    devmode: false,
    defaultAccount: {
      autoCreate: true,
      username: 'dorst',
      password: 'ikwilpils'
    }
  },
  db: {
    host: 'cluster0-zdik9.mongodb.net',
    username: 'dikkelul3bier',
    password: 'mVHy5EoRm954TQ59',
    name: 'oscar'
  },
  scraper: {
    uri: 'https://www.biernet.nl/bier/aanbiedingen'
  }
}

module.exports = backend
