const express = require('express')

const buildApp = (mount, router, session = {}) => {
  const app = express()
  // the real server drops this via helmet
  app.disable('x-powered-by')
  app.use(express.json())
  app.use((req, res, next) => {
    req.session = session
    req.realIp = '203.0.113.1'
    next()
  })
  app.use(mount, router)
  return { app, session }
}

const query = value => ({ exec: () => Promise.resolve(value) })
const selected = value => ({ select: () => query(value) })
const selectedRejecting = error => ({ select: () => ({ exec: () => Promise.reject(error) }) })

module.exports = { buildApp, query, selected, selectedRejecting }
