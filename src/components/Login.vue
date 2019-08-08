<template>
  <body>
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div v-if="error" class="notification is-danger">
            <button class="delete" @click="error = ''"></button>
              {{error}}
          </div>
          <div v-if="message" class="notification is-success">
            <button class="delete" @click="error = ''"></button>
              {{message}}
          </div>
          <h3 class="title has-text-grey">Login</h3>
          <p class="subtitle has-text-grey">Please login to proceed.</p>
          <div class="box">
            <form>
            <div v-if="!otpRequired" class="field">
              <div class="control">
                <input class="input is-large" v-model="username" type="username" placeholder="Your username" autofocus>
              </div>
            </div>
            <div v-if="!otpRequired" class="field">
              <div class="control">
                <input class="input is-large" v-model="password" type="password" placeholder="Your password">
              </div>
            </div>
            <div v-if="otpRequired" class="field">
              <div class="control">
                <input class="input is-large" v-model="token" type="token" placeholder="2fa code" ref="token">
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
  </body>
</template>

<script>
  import Api from '@/services/Api'

  export default {
    data() {
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
      isDisabled:function() {
        if (!this.$data.username || !this.$data.password){
          return true
        }
      }
    },
    methods: {
      Post() {
        const data = {
          username: this.$data.username,
          password: this.$data.password,
          remember: this.$data.remember,
          token: this.$data.token
        }
        Api().post(`/api/v1/users/login`, data)
        .then(response => {
          if ( response.data.otp ) { 
            this.otpRequired = true
            this.message = 'Two factor authentication required.'
          } else if ( response.status === 200 ){
            this.$parent.isAuthenticated = true
            localStorage.setItem('isAuthenticated', response.data._id)
            if (response.data.admin) {
              this.$parent.isAdmin = true
              localStorage.setItem('isAdmin', 'You should not be here ಠ_ಠ')
            }
            const query = this.$route.query
            this.$router.push((query.redirect) ? { path: query.redirect, query } : '/home' )
          }
        })
        .catch(e => {
          this.error = e.response.data || e
          console.error(e)
        })
      }
    },
    updated() {
      if (this.otpRequired) this.$refs.token.focus()
    },
    beforeMount() { // Refresh, fresh page load
      if (this.$parent.isAuthenticated){
        this.$router.push('/home')
      }
    },
    beforeUpdate () { // Uri change, link, etc.
      if (this.$parent.isAuthenticated){
        this.$router.push('/home')
      }
    }
  }
</script>
