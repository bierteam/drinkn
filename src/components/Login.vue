<template>
<body>
  <section class="hero">
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div v-if="error" class="notification is-danger">
            <button class="delete" @click="error = ''"></button>
              {{error}}
          </div>
          <h3 class="title has-text-grey">Login</h3>
          <p class="subtitle has-text-grey">Please login to proceed.</p>
          <div class="box">
            <form>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="email" type="email" placeholder="Your email" autofocus="">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="password" type="password" placeholder="Your password">
              </div>
            </div>
            <div class="field">
              <label class="checkbox tooltip is-tooltip-right" data-tooltip='For 30 days'>
                <input type="checkbox" v-model="remember">
                Remember me
              </label>
            </div>
            <button class="button is-block is-info is-large is-fullwidth" @click='Post' :disabled="isDisabled">Login</button>
            </form>
          </div>
          <p class="has-text-grey">
          <a href="../">Forgot Password</a> &nbsp;·&nbsp;
          <a href="../">Need Help?</a>
          </p>
        </div>
      </div>
    </div>
  </section>
</body>
</template>

<script>
  import Api from '@/services/Api'

  export default {
    data() {
      return {
        email: '',
        password: '',
        remember: true,
        error: ''
      }
    },
    computed: {
      isDisabled:function() {
        if (!this.$data.email || !this.$data.password){
          return true
        }
      }
    },
    methods: {
      Post() {
        const email = this.$data.email
        const password = this.$data.password
        const remember = this.$data.remember
        Api().post(`api/v1/users/login`, {
          email, password, remember
        })
        .then(response => {
          if ( response.status === 200 ) {
            this.$parent.isAuthenticated = true
            this.$router.push(this.$route.query.redirect || '/home')
          }
        })
        .catch(e => {
          this.error = e.response.data
          console.error(e)
        })
      }
    },
      beforeMount: function () { // Fresh page load
    if (this.$parent.isAuthenticated){
      this.$router.push('/home')
    }
  },
  beforeUpdate: function () { // Refresh, url change, link, etc.
    if (this.$parent.isAuthenticated){
      this.$router.push('/home')
    }
  }
  }
</script>
