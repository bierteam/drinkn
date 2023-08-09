<template>
<div class="has-text-centered">
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a role="button" class="navbar-burger burger" v-if="isAuthenticated" @click="burger = !burger" aria-label="menu" aria-expanded="false" data-target="navbar" v-bind:class="{'is-active': burger}">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div id="navbar" class="navbar-menu" v-if="isAuthenticated" @mouseleave="burger = false" v-bind:class="{'is-active': burger}">
      <div class="navbar-start">
        <router-link class="navbar-item" to="/home">Home</router-link>
        <router-link class="navbar-item" to="/discounts">Discounts</router-link>
        <div class="navbar-item has-dropdown is-hoverable" v-if="isAdmin">
          <a class="navbar-link">Admin</a>
          <div class="navbar-dropdown">
            <router-link class="navbar-item" to="/register">Register users</router-link>
            <router-link class="navbar-item" to="/users">Users</router-link>
            <router-link class="navbar-item" to="/import">Import data</router-link>
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
          <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
        </p>
      </div>
    </div>
  </footer>
</div>
</template>

<script>
import Api from '/src/services/Api'

export default {
  name: 'App',
  data() {
    const isAuthenticated = !!localStorage.getItem('isAuthenticated')
    const isAdmin = !!localStorage.getItem('isAdmin')
    const userId = isAuthenticated ? localStorage.getItem('isAuthenticated') : null

    return {
      burger: false,
      isAuthenticated,
      isAdmin,
      userId
    }
  },
  methods: {
    Logout() {
      Api().delete(`/api/v1/users/logout`)
        .then(response => {
          if (response.status === 200) {
            this.$data.isAuthenticated = false
            this.$data.isAdmin = false
            localStorage.clear()
            this.$router.push('/login')
          }
        })
        .catch(e => {
          console.error(e)
        })
    },
    Redirect() {
      if (!this.isAuthenticated) {
        const query = this.$route.query
        if (this.$route.path !== '/home' && this.$route.path !== '/login') {
          query.redirect = this.$route.path
        }
        this.$router.push({
          path: '/login',
          query
        })
      }
    },
    Check() {
      Api().get(`/api/v1/users/check`)
        .then(response => {
          if (!response.data) {
            this.$data.isAuthenticated = false
            this.$data.isAdmin = false
            localStorage.clear()
            this.$router.push('/login')
          }
        })
        .catch(e => {
          console.error(e)
        })
    }
  },
  beforeMount() { // Refresh, fresh page load
    this.Redirect()
    this.Check()
  },
  beforeUpdate() { // Uri change, link, etc.
    this.Redirect()
  }
}
</script>

<style>
@import 'bulma/css/bulma.css'
</style>
