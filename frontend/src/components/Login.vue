<script>
import Api from '../services/Api'
import { store } from '../store.js'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'

export default {
  data () {
    return {
      username: '',
      password: '',
      remember: true,
      error: '',
      message: '',
      passkeySupported: browserSupportsWebAuthn(),
      passkeyBusy: false
    }
  },
  computed: {
    isDisabled: function () {
      return !this.username || !this.password
    }
  },
  methods: {
    Post () {
      const data = {
        username: this.$data.username,
        password: this.$data.password,
        remember: this.$data.remember
      }
      Api().post(`/api/v1/users/login`, data)
        .then(response => {
          if (response.status === 200) {
            this.Succeed(response.data)
          }
        })
        .catch(e => {
          this.error = e.response?.data || e
          console.error(e)
        })
    },
    async Passkey () {
      this.error = ''
      this.passkeyBusy = true
      try {
        // the options carry the challenge, which the server also keeps in the
        // session; the round trip is what ties this attempt to that challenge
        const options = await Api().post(`/api/v1/users/login/passkey/options`, {})
        const response = await startAuthentication({ optionsJSON: options.data })
        const login = await Api().post(`/api/v1/users/login/passkey`, {
          response,
          remember: this.remember
        })
        this.Succeed(login.data)
      } catch (e) {
        // dismissing the browser's own prompt is not a failure worth shouting
        // about, and it is the most common way out of this dialog
        if (e.name === 'NotAllowedError' || e.name === 'AbortError') {
          this.message = 'Passkey sign in was cancelled.'
        } else {
          this.error = e.response?.data || e.message || e
          console.error(e)
        }
      } finally {
        this.passkeyBusy = false
      }
    },
    Succeed (data) {
      store.setAuthenticated(data._id)
      if (data.admin) {
        store.setAdmin(true)
      }
      const redirect = this.$route.query.redirect
      this.$router.push(redirect || '/discounts')
    }
  }
}
</script>

<template>
<div class="hero">
  <div class="hero-body">
    <div class="container has-text-centered">
      <div class="column is-4 is-offset-4">
        <div v-if="error" class="notification is-danger">
          <button type="button" class="delete" @click="error = ''"></button>
          {{error}}
        </div>
        <div v-if="message" class="notification is-success">
          <button type="button" class="delete" @click="message = ''"></button>
          {{message}}
        </div>
        <h3 class="title has-text-grey">Login</h3>
        <p class="subtitle has-text-grey">Please login to proceed.</p>
        <div class="box">
          <form>
            <div class="field">
              <div class="control">
                <label class="is-sr-only" for="login-username">Username</label>
                <input id="login-username" class="input is-large" v-model="username" type="text" name="username" autocomplete="username webauthn" placeholder="Your username" autofocus>
              </div>
            </div>
            <div class="field">
              <div class="control">
                <label class="is-sr-only" for="login-password">Password</label>
                <input id="login-password" class="input is-large" v-model="password" type="password" name="password" autocomplete="current-password" placeholder="Your password">
              </div>
            </div>
            <div class="field">
              <label class="checkbox tooltip is-tooltip-right" data-tooltip='For 30 days'>
                <input type="checkbox" v-model="remember">
                Remember me
              </label>
            </div>
            <button type="submit" class="button is-block is-primary is-large is-fullwidth" @click.prevent='Post' :disabled="isDisabled">Login</button>
            <button v-if="passkeySupported" type="button" class="button is-block is-light is-large is-fullwidth mt-3" :class="{ 'is-loading': passkeyBusy }" @click.prevent='Passkey'>Use a passkey</button>
          </form>
        </div>
        <p class="has-text-grey">
          <a href="../">Forgot Password</a> &nbsp;·&nbsp;
          <a href="../">Need Help?</a>
        </p>
      </div>
    </div>
  </div>
</div>
</template>
