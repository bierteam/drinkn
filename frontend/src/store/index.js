import Vue from 'vue'
import Vuex from 'vuex'
import Decode from 'jwt-decode'
import Api from '../services/Api'

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
      if (state.jwt) return Decode(state.jwt)
    }
  },
  actions: {
    refresh: state => {
      Api().get('auth/refresh')
        .then(response => {
          if (response.status === 200) {
            state.commit('saveJWT', response.data.jwt)
          }
        })
        .catch(error => {
          console.error(error)
        })
    }
  },
  modules: {
  },
  strict: process.env.NODE_ENV !== 'production' // throw error if used incorrecty https://vuex.vuejs.org/guide/strict.html
})
