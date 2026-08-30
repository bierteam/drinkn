import axios from 'axios'
import { store } from '../store.js'
import { Router } from '../router'

// one shared instance: every call site used to build a throwaway client,
// which left nowhere to hang shared behaviour like the handler below
const client = axios.create({})

const SAFE_METHODS = new Set(['get', 'head', 'options'])

// fetched once: the token is tied to the session, not to a single form
let csrfToken = null
let inFlight = null

const fetchToken = () => {
  // share one request: several components load at once on first paint
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
    // the session was replaced, so its token is stale: retry it once
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
