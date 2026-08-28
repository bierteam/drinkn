import axios from 'axios'
import { store } from '../store.js'
import { Router } from '../router'

// one shared instance: every call site used to build a throwaway client,
// which left nowhere to hang shared behaviour like the handler below
const client = axios.create({})

// an expired session should return you to the login screen rather than
// surfacing as a console error and an empty page in each component
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const current = Router.currentRoute.value
      store.logout()
      if (current.path !== '/login') {
        Router.push({ path: '/login', query: { redirect: current.fullPath } })
      }
    }
    return Promise.reject(error)
  }
)

export default () => client
