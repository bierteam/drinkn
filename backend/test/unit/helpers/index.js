const express = require('express')

// A stand-in for express-session: the handlers only read and write plain
// properties, so a bare object is enough to assert what they store.
const buildApp = (mount, router, session = {}) => {
  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    req.session = session
    req.realIp = '203.0.113.1'
    next()
  })
  app.use(mount, router)
  return { app, session }
}

// The two mongoose shapes the routers use: a plain query, and one narrowed by
// select() before it is awaited.
const query = value => ({ exec: () => Promise.resolve(value) })
const selected = value => ({ select: () => query(value) })
const selectedRejecting = error => ({ select: () => ({ exec: () => Promise.reject(error) }) })

module.exports = { buildApp, query, selected, selectedRejecting }
