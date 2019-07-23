/* global test, expect */

const request = require('supertest')
const app = require('../../../app')
test('It should response the GET method', async (done) => {
  const response = await request(app).get('/api/v1/logging/logs')
  expect(response.statusCode).toBe(200)
  done()
})
