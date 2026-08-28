<script>
import Api from '../services/Api'
import pwned from '../services/pwned'

export default {
  data () {
    return {
      user: {},
      newUser: {},
      state: {
        error: false,
        saving: false,
        saved: false,
        isPwned: false,
        deleteMsg: false
      }
    }
  },
  created () {
    this.fetchUser()
  },
  computed: {
    shouldDisableButton () {
      return this.state.isPwned
    }
  },
  methods: {
    async fetchUser () {
      try {
        const _id = this.$route.params.id
        const response = await Api().get(`/api/v1/users/${_id}`, {})
        if (response.status === 200) {
          this.user = response.data
          this.newUser.admin = this.user.admin
        }
      } catch (error) {
        this.handleApiError(error)
      }
    },
    async checkPwned (password) {
      this.state.isPwned = await pwned(password)
    },
    async updateUser () {
      this.state.saved = false
      this.state.saving = true
      try {
        const _id = this.$route.params.id
        const response = await Api().post(`/api/v1/users/${_id}`, {
          user: this.newUser
        })
        this.user = response.data
        this.newUser = {
          admin: this.user.admin
        }
        this.state.saved = true
        this.state.saving = false
        this.state.error = false
      } catch (error) {
        this.handleApiError(error)
        this.state.saving = false
      }
    },
    async deleteUser () {
      try {
        const _id = this.$route.params.id
        const response = await Api().delete(`/api/v1/users/${_id}`)
        if (response.status === 200) {
          this.$router.push('/users')
        }
      } catch (error) {
        this.handleApiError(error)
      }
    },
    toggleDeleteMsg () {
      this.state.deleteMsg = !this.state.deleteMsg
    },
    clearError () {
      this.state.error = ''
    },
    handleApiError (error) {
      this.state.error = error.response?.data || error.message || error
      console.error(error)
    }
  }
}
</script>

<template>
<div class="hero-body">
  <div class="container has-text-centered">
    <div class="column is-4 is-offset-4">
      <div v-if="state.isPwned" class="notification is-warning">
        This password has been pwned.
      </div>
      <div v-if="state.error" class="notification is-danger">
        <button type="button" class="delete" @click="clearError"></button>
        {{ state.error }}
      </div>
      <h3 class="title has-text-grey">Edit account</h3>
      <div class="box">
        <form>
          <div class="field">
            <div class="control">
              <label class="is-sr-only" for="user-username">Username</label>
              <input id="user-username" class="input is-large" v-model="newUser.username" type="text" name="username" autocomplete="username" :placeholder="user.username">
            </div>
          </div>
          <div class="field">
            <div class="control">
              <label class="is-sr-only" for="user-password">New password</label>
              <input id="user-password" class="input is-large" v-model="newUser.password" @input="checkPwned(newUser.password)" type="password" name="new-password" autocomplete="new-password" placeholder="Their new password">
            </div>
          </div>
          <div class="field">
            <label class="checkbox" for="user-admin">
              <input id="user-admin" type="checkbox" v-model="newUser.admin">
              Administrator
            </label>
            Admin
          </div>
          <div class="columns">
            <div class="column">
              <button class="button is-light is-large is-fullwidth" @click.prevent="updateUser" :class="{
                  'is-loading': state.saving,
                  'is-success': state.saved,
                  'is-danger': state.error }" type="submit" :disabled="shouldDisableButton">Save</button>
            </div>
            <div class="column">
              <button class="button is-danger is-large is-fullwidth" @click="toggleDeleteMsg" type="button">Delete</button>
            </div>
          </div>
          <div v-if="state.deleteMsg" class="notification is-light">
            <button type="button" class="delete" @click="toggleDeleteMsg"></button>
            Are you sure? This is permanent.
            <br><br>
            <button class="button is-danger is-large" @click="deleteUser" type="button">I am sure!</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
</template>
