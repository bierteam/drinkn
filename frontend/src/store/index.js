import Vue from 'vue'
import Vuex from 'vuex'
import decode from 'jwt-decode'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    jwt: '',
    isNavOpen: false
  },
  mutations: {
    saveJWT (state, jwt) {
      state.jwt = jwt
    },
    setNav (state) {
      state.isNavOpen = !state.isNavOpen
    }
  },
  getters: {
    decodedJWT: state => {
      if (state.jwt) return decode(state.jwt)
    }
  },
  actions: {
  },
  modules: {
  },
  strict: process.env.NODE_ENV !== 'production' // throw error if used incorrecty https://vuex.vuejs.org/guide/strict.html
})
