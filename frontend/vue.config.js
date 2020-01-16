module.exports = {
  devServer: {
    proxy: {
      '^/api/v2/cocktail': {
        target: 'http://localhost:3001/',
        ws: true
      },
      '^/api/v2/supermarket': {
        target: 'http://localhost:3002/',
        ws: true
      },
      '^/api/v2/beer': {
        target: 'http://localhost:3003/',
        ws: true
      },
      '^/api/v2/auth': {
        target: 'http://localhost:3004/',
        ws: true
      }
    }
  }
}
