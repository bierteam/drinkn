<script>
import Api from './services/Api'
import { store } from './store.js'

export default {
  name: 'App',
  setup () {
    return {
      store
    }
  },
  data () {
    return {
      // bulma hides .navbar-menu below 1024px until the burger opens it
      menuOpen: false
    }
  },
  watch: {
    // vue-router hands out a fresh route object per navigation, so this fires
    // on every page change: the open menu would otherwise sit on top of it
    $route () {
      this.closeMenu()
    }
  },
  methods: {
    closeMenu () {
      this.menuOpen = false
    },
    Logout () {
      Api().delete(`/api/v1/users/logout`)
        .then(() => {
          store.logout()
          this.$router.push('/login')
        })
        .catch(e => {
          console.error(e)
          store.logout()
          this.$router.push('/login')
        })
    }
  }
}
</script>

<template>
<div class="has-text-centered">
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <button
        type="button"
        class="navbar-burger"
        :class="{ 'is-active': menuOpen }"
        aria-label="menu"
        :aria-expanded="menuOpen"
        aria-controls="navbar"
        v-if="store.isAuthenticated"
        @click="menuOpen = !menuOpen">
        <!-- four: bulma 1.x rotates the first two into the cross and hides
             the other two -->
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>
    </div>
    <div id="navbar" class="navbar-menu" :class="{ 'is-active': menuOpen }" v-if="store.isAuthenticated">
      <div class="navbar-start">
        <router-link class="navbar-item" to="/home">Home</router-link>
        <router-link class="navbar-item" to="/discounts">Discounts</router-link>
        <router-link class="navbar-item" to="/products">All beers</router-link>
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
            <button type="button" class="button is-primary" @click='Logout'>Logout</button>
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
            &copy; BierTeam {{ new Date().getFullYear() }}
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
