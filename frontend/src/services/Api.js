import axios from 'axios'
import { store } from '../store.js'
import { Router } from '../router'

// one shared instance: every call site used to build a throwaway client,
// which left nowhere to hang shared behaviour like the handler below
const client = axios.create({})

const SAFE_METHODS = new Set(['get', 'head', 'options'])

// Fetched once and reused. The token is tied to the session rather than to a
// single form, so it stays valid until the session ends.
let csrfToken = null
let inFlight = null

const fetchToken = () => {
  // share one request: several components load at once on first paint, and
  // each would otherwise ask for its own token
  inFlight = inFlight || axios.get('/api/v1/csrf')
    .then(response => {
      csrfToken = response.data.token
      return csrfToken
    })
    .finally(() => { inFlight = null })
  return inFlight
}

client.interceptors.request.use(async config => {
  if (SAFE_METHODS.has((config.method || 'get').toLowerCase())) return config

  config.headers['X-CSRF-Token'] = csrfToken || await fetchToken()
  return config
})

// an expired session should return you to the login screen rather than
// surfacing as a console error and an empty page in each component
client.interceptors.response.use(
  response => response,
  async error => {
    // the session was replaced, so the token that went with it is stale. Fetch
    // a fresh one and let the original call through once more, rather than
    // making the person retry by hand.
    if (error.response?.status === 403 && !error.config?._csrfRetried) {
      error.config._csrfRetried = true
      csrfToken = null
      error.config.headers['X-CSRF-Token'] = await fetchToken()
      return client.request(error.config)
    }

    if (error.response?.status === 401) {
      const current = Router.currentRoute.value
      store.logout()
      if (current.path !== '/login') {
        Router.push({ path: '/login', query: { redirect: current.fullPath } })
      }
    }
    throw error
  }
)

const Api = () => client

export default Api
