<script>
import Api from './services/Api'
import { store } from './store.js'

export default {
  name: 'App',
  setup() {
    return {
      store
    }
  },
  methods: {
    Logout() {
      Api().delete(`/api/v1/users/logout`)
        .then(response => {
          if (response.status === 200) {
            store.logout()
            this.$router.push('/login')
          }
        })
        .catch(e => {
          console.error(e)
        })
    },
    Check() {
      Api().get(`/api/v1/users/check`)
        .then(response => {
          if (response.data) {
            console.log(response.data)
            } else {
            store.logout()
            this.$router.push('/login')
          }
        })
        .catch(e => {
          console.error(e)
        })
    }
  }
}
</script>

<template>
<div class="has-text-centered">
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand"></div>
    <div id="navbar" class="navbar-menu" v-if="store.isAuthenticated">
      <div class="navbar-start">
        <router-link class="navbar-item" to="/home">Home</router-link>
        <router-link class="navbar-item" to="/discounts">Discounts</router-link>
        <div class="navbar-item has-dropdown is-hoverable" v-if="store.isAdmin">
          <a class="navbar-link">Admin</a>
          <div class="navbar-dropdown">
            <router-link class="navbar-item" to="/register">Register users</router-link>
            <router-link class="navbar-item" to="/users">Users</router-link>
            <!-- <router-link class="navbar-item" to="/import">Import data</router-link> -->
            <router-link class="navbar-item" to="/storemapping">Map store names</router-link>
            <router-link class="navbar-item" to="/logging">Logging</router-link>
          </div>
        </div>
      </div>

      <div class="navbar-end">
        <div class="navbar-item">
          <div class="buttons">
            <router-link class="button is-light" to="/account">Account</router-link>
            <button class="button is-primary" @click='Logout'>Logout</button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <router-view />

  <footer class="footer">
    <div class="columns">
      <div class="column">
        <a href="https://github.com/bierteam">
          &copy; BierTeam 2023
        </a>
        <p>The source code is licensed
          <a href="https://opensource.org/licenses/mit-license.php">MIT</a>.
        </p>
      </div>
    </div>
  </footer>
</div>
</template>

<style>
@import 'bulma/css/bulma.css'
</style>
