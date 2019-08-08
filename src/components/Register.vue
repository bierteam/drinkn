<template>
  <body>
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div v-if="message" class="notification is-success">
            <button class="delete" @click="message = ''"></button>
              {{message}}
          </div>
          <div v-if="isPwned" class="notification is-warning">
              This password has been pwned.
          </div>
          <div v-if="error" class="notification is-danger">
            <button class="delete" @click="error = ''"></button>
              {{error}}
          </div>
          <h3 class="title has-text-grey">Register</h3>
          <p class="subtitle has-text-grey">Create a new user.</p>
          <div class="box">
            <form>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="username" type="username" placeholder="Their username" autofocus>
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="password" type="password" placeholder="Their password">
              </div>
            </div>
            <div class="field">
                <input type="checkbox" v-model="admin">
                Make this user an administrator
            </div>
            <button type="submit" class="button is-block is-light is-large is-fullwidth" @click.prevent='Post' :disabled="isDisabled">Register new account</button>
            </form>
          </div>
          <p class="has-text-grey">
          <a href="../">Login</a> &nbsp;·&nbsp;
          <a href="../">Need Help?</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</template>

<script>
  import Api from '@/services/Api'
  import pwned from "havetheybeenpwned"

  export default {
    data() {
      return {
        username: '',
        password: '',
        admin: false,
        isPwned: false,
        message: '',
        error: ''
      }
    },
    computed: {
      isDisabled:function() {
        pwned(this.$data.password).then(isPwned => {
          this.$data.isPwned = isPwned
        })
        return (this.$data.username && this.$data.password && !this.$data.isPwned) ? false : true
      }
    },
    methods: {
      Post() {
        const username = this.$data.username
        const password = this.$data.password
        const admin = this.$data.admin
        Api().post(`/api/v1/users/register`, {
          username, password, admin
        })
        .then( response => {
          if (response.status === 201) {
            this.$data.message = 'Created ' + this.$data.username     
          } else if (response.status === 200) {
            this.$data.error = response.data
          }
        })
        .catch(e => {
          this.$data.error = e.response.data || e
          console.error(e)
        })
      }
    }
  }
</script>
