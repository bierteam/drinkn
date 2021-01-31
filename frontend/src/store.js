import Vue from 'vue'

export const store = Vue.observable({
  isNavOpen: false,
  jwt: ""
})

export const mutations = {
  setIsNavOpen (yesno) {
    store.isNavOpen = yesno
  },
  toggleNav () {
    store.isNavOpen = !store.isNavOpen
  },
  setJwt (jwt) {
    store.jwt = jwt
  }
}
