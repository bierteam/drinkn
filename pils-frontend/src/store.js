import { reactive } from 'vue'
/* global localStorage */

export const store = reactive({
  isAuthenticated: !!localStorage.getItem('isAuthenticated'),
  isAdmin: !!localStorage.getItem('isAdmin'),
  userId: null,
  setAuthenticated (userId) {
    localStorage.setItem('isAuthenticated', userId)
    this.isAuthenticated = true
    this.userId = userId
  },
  setAdmin () {
    localStorage.setItem('isAdmin', 'Arrr, hello pirate! 🏴')
    this.isAdmin = true
  },
  logout () {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('isAdmin')
    this.isAuthenticated = false
    this.userId = null
  }
})

if (store.isAuthenticated) {
  store.userId = localStorage.getItem('isAuthenticated')
}
