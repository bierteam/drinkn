const config = require('./config')
const app = require('./app')

app.listen(config.app.port, function () {
  console.log(`Beer backend running on port ${config.app.port}!`)
})
