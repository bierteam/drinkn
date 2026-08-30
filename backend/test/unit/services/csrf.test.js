const request = require('supertest')
const express = require('express')
const csrf = require('../../../services/csrf')

const buildApp = () => {
  const session = {}
  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    req.session = session
    next()
  })
  app.get('/token', (req, res) => res.json({ token: csrf.generateToken(req) }))
  app.use(csrf.protect)
  app.get('/read', (req, res) => res.send('read'))
  app.post('/write', (req, res) => res.send('written'))
  app.delete('/write', (req, res) => res.send('deleted'))
  // four parameters is what marks this an error handler, so `next` stays
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(err.statusCode || 500).send(err.message))
  return { app, session }
}

const tokenFor = async app => {
  const res = await request(app).get('/token')
  return res.body.token
}

describe('reads', () => {
  it('need no token, or the token could never be fetched', async () => {
    const { app } = buildApp()

    const res = await request(app).get('/read')

    expect(res.status).toBe(200)
  })
})

describe('writes', () => {
  it('are refused without a token', async () => {
    const { app } = buildApp()

    const res = await request(app).post('/write').send({})

    expect(res.status).toBe(403)
  })

  it('are refused with someone else\'s token', async () => {
    const { app } = buildApp()
    const other = await tokenFor(buildApp().app)

    const res = await request(app).post('/write').set('X-CSRF-Token', other).send({})

    expect(res.status).toBe(403)
  })

  it('go through with the token from this session', async () => {
    const { app } = buildApp()
    const token = await tokenFor(app)

    const res = await request(app).post('/write').set('X-CSRF-Token', token).send({})

    expect(res.status).toBe(200)
  })

  it('cover deletes as well as posts', async () => {
    const { app } = buildApp()
    const token = await tokenFor(app)

    const refused = await request(app).delete('/write')
    const allowed = await request(app).delete('/write').set('X-CSRF-Token', token)

    expect(refused.status).toBe(403)
    expect(allowed.status).toBe(200)
  })

  it('keeps the token in the session, not in a second cookie', async () => {
    const { app, session } = buildApp()
    const token = await tokenFor(app)

    expect(Object.values(session)).toContain(token)
  })
})
