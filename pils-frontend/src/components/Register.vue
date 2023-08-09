<template>
<div class="hero-body">
  <div class="container has-text-centered">
    <div class="column is-4 is-offset-4">
      <div v-if="message" class="notification is-success">
        <button class="delete" @click="message = ''"></button>
        {{ message }}
      </div>
      <div v-if="isPwned" class="notification is-warning">
        This password has been pwned.
      </div>
      <div v-if="error" class="notification is-danger">
        <button class="delete" @click="error = ''"></button>
        {{ error }}
      </div>
      <h3 class="title has-text-grey">Register</h3>
      <p class="subtitle has-text-grey">Create a new user.</p>
      <div class="box">
        <form>
          <div class="field">
            <div class="control">
              <input class="input is-large" v-model="username" type="username" placeholder="Username" autofocus>
            </div>
          </div>
          <div class="field">
            <div class="control">
              <input class="input is-large" v-model="password" @input="checkPwned(password)" type="password" placeholder="Password">
            </div>
          </div>
          <div class="field">
            <input type="checkbox" v-model="admin">
            Make this user an administrator
          </div>
          <button type="submit" class="button is-block is-light is-large is-fullwidth" @click.prevent="registerAccount" :disabled="shouldDisableButton">Register new account</button>
        </form>
      </div>
      <p class="has-text-grey">
        <a href="../">Login</a> &nbsp·&nbsp
        <a href="../">Need Help?</a>
      </p>
    </div>
  </div>
</div>
</template>

<script>
import Api from '/src/services/Api'
import pwned from "/src/services/pwned"

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
    shouldDisableButton() {
      return !this.username || !this.password || this.isPwned
    }
  },
  methods: {
    async checkPwned(password) {
      this.isPwned = await pwned(password)
    },
    async registerAccount() {
      if (this.username && this.password && !this.isPwned) {
        try {
          const response = await Api().post(`/api/v1/users/register`, {
            username: this.username,
            password: this.password,
            admin: this.admin
          })
          if (response.status === 201) {
            this.message = 'Created ' + this.username
          } else if (response.status === 200) {
            this.error = response.data
          }
        } catch (error) {
          this.error = error.response?.data || error.message || error
          console.error(error)
        }
      }
    }
  }
}
</script>
