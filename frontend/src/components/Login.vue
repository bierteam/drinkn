<script>
import Api from '../services/Api'
import { store } from '../store.js'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import * as passkeyError from '../services/passkeyError'

export default {
  data () {
    return {
      username: '',
      password: '',
      remember: true,
      error: '',
      message: '',
      passkeySupported: browserSupportsWebAuthn(),
      passkeyBusy: false,
      preview: { enabled: false }
    }
  },
  created () {
    this.Preview()
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
        const detail = passkeyError.log('authentication', e)

        // an abort is a password manager handing the ceremony over, not a
        // refusal -- see the same branch in Account.vue
        if (detail.name === 'AbortError') return

        if (detail.name === 'NotAllowedError') {
          this.error = 'No passkey was offered. If a password manager extension handles passkeys for you, turn that off and try again.'
        } else {
          this.error = e.response?.data || detail.message || e
        }
      } finally {
        this.passkeyBusy = false
      }
    },
    // only a preview namespace answers with anything; production reports
    // disabled, and a failure here must never block signing in
    async Preview () {
      try {
        const response = await Api().get(`/api/v1/users/preview`, {})
        this.preview = response.data
      } catch {
        this.preview = { enabled: false }
      }
    },
    FillPreview () {
      this.username = this.preview.username
      this.password = this.preview.password
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
        <div v-if="preview.enabled" class="notification is-info is-light has-text-left">
          <strong>Preview environment</strong>
          <p>
            Throwaway database, thrown away with the pull request. Sign in with
            <code>{{preview.username}}</code> / <code>{{preview.password}}</code>.
          </p>
          <button type="button" class="button is-small is-info mt-2" @click="FillPreview">Fill them in</button>
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
