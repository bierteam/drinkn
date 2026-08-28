<script>
import Api from '../services/Api'
import { store } from '../store.js'

export default {
  data () {
    return {
      username: '',
      password: '',
      token: undefined,
      otpRequired: false,
      remember: true,
      error: '',
      message: ''
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
        remember: this.$data.remember,
        token: this.$data.token
      }
      Api().post(`/api/v1/users/login`, data)
        .then(response => {
          if (response.data.otp) {
            this.otpRequired = true
            this.message = 'Two factor authentication required.'
          } else if (response.status === 200) {
            store.setAuthenticated(response.data._id)
            if (response.data.admin) {
              store.setAdmin(true)
            }
            const redirect = this.$route.query.redirect
            this.$router.push(redirect || '/discounts')
          }
        })
        .catch(e => {
          this.error = e.response?.data || e
          console.error(e)
        })
    }
  },
  updated () {
    if (this.otpRequired) this.$refs.token.focus()
  }
}
</script>

<template>
<div class="hero">
  <div class="hero-body">
    <div class="container has-text-centered">
      <div class="column is-4 is-offset-4">
        <div v-if="error" class="notification is-danger">
          <button class="delete" @click="error = ''"></button>
          {{error}}
        </div>
        <div v-if="message" class="notification is-success">
          <button class="delete" @click="message = ''"></button>
          {{message}}
        </div>
        <h3 class="title has-text-grey">Login</h3>
        <p class="subtitle has-text-grey">Please login to proceed.</p>
        <div class="box">
          <form>
            <div v-if="!otpRequired" class="field">
              <div class="control">
                <input class="input is-large" v-model="username" type="text" name="username" autocomplete="username" placeholder="Your username" autofocus>
              </div>
            </div>
            <div v-if="!otpRequired" class="field">
              <div class="control">
                <input class="input is-large" v-model="password" type="password" name="password" autocomplete="current-password" placeholder="Your password">
              </div>
            </div>
            <div v-if="otpRequired" class="field">
              <div class="control">
                <input class="input is-large" v-model="token" type="text" name="token" inputmode="numeric" autocomplete="one-time-code" placeholder="2fa code" ref="token">
              </div>
            </div>
            <div v-if="!otpRequired" class="field">
              <label class="checkbox tooltip is-tooltip-right" data-tooltip='For 30 days'>
                <input type="checkbox" v-model="remember">
                Remember me
              </label>
            </div>
            <button type="submit" class="button is-block is-primary is-large is-fullwidth" @click.prevent='Post' :disabled="isDisabled">Login</button>
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
