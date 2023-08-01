<template>
  <body>
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div v-if="state.pwned" class="notification is-warning">
              This password has been pwned.
          </div>
          <div v-if="state.error" class="notification is-danger">
            <button class="delete" @click="state.error = ''"></button>
              {{state.error}}
          </div>
          <h3 class="title has-text-grey">Edit account</h3>
          <div class="box">
            <form>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.username" type="username" :placeholder="user.username">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.password" type="password" placeholder="Their new password">
              </div>
            </div>
            <div class="field">
              <input type="checkbox" v-model="newUser.admin">
              Admin
            </div>
            <div class="columns">
              <div class="column">
                <Button class="button is-light is-large is-fullwidth" @click.prevent='Update' v-bind:class="{
                  'is-loading': state.saving,
                  'is-success': state.saved,
                  'is-danger': state.error }"
                  type="submit" :disabled="isDisabled">Save</Button>
              </div>
              <div class="column">
                <Button class="button is-danger is-large is-fullwidth" @click='state.deleteMsg = !state.deleteMsg' type="button" >Delete</Button>
              </div>
            </div>
            <div v-if="state.deleteMsg" class="notification is-light">
              <button class="delete" @click="state.deleteMsg = false"></button>
              Are you sure? This is permanent.
              <br><br>
              <Button class="button is-danger is-large" @click='Delete' type="button" >I am sure!</Button>
            </div>
            </form>
          </div>
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
        user: {},
        newUser: {},
        error: '',
        state: {
          error: false,
          saving: false,
          saved: false,
          pwned: false,
          deleteMsg: false
        }
      }
    },
    created () {
      this.User()
    },
    computed: {
      isDisabled:function() {
        pwned(this.newUser.password).then(isPwned => {
          this.state.pwned = isPwned
        })
        return (!this.state.pwned) ? false : true
      }
    },
    methods: {
      async User() {
        const _id = this.$route.params.id
        Api().get(`/api/v1/users/${_id}`, {})
        .then( response => {
          if (response.status === 200) {
            this.user = response.data
            this.newUser.admin = this.user.admin
          }
        })
        .catch(e => {
          this.state.error = e.response.data || e
          console.error(e)
        })
      },
      Update() {
        this.state.saved = false
        this.state.saving = true
        const user = this.newUser
        const _id = this.$route.params.id
        Api().post(`/api/v1/users/${_id}`, {
          user
        })
        .then(response => {
          this.user = response.data
          this.newUser = {}
          this.newUser.admin = this.user.admin
          this.state.saved = true
          this.state.saving = false
          this.state.error = false
        })
        .catch(e => {
          this.state.error = e.response.data || e
          console.error(e)
          this.state.saving = false
        })
      },
      Delete() {
        const _id = this.$route.params.id
        Api().delete(`/api/v1/users/${_id}`)
        .then(response => {
          if (response.status === 200) {
            this.$router.push('/users')
          }
        })
        .catch(e => {
        this.state.error = e.response.data || e
        console.error(e)
        })
      }
    }
  }
</script>
