<template>
  <body>
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div v-if="state.pwned" class="notification is-warning">
              This password has been pwned.
          </div>
          <div v-if="state.notEqual" class="notification is-warning">
              The password is not the same.
          </div>
          <div v-if="error" class="notification is-danger">
            <button class="delete" @click="error = ''"></button>
              {{error}}
          </div>
          <h3 class="title has-text-grey">Edit your account</h3>
          <div class="box">
            <form>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.username" type="email" :placeholder="user.username">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.password" type="password" placeholder="Your new password">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="verifyPassword" type="password" placeholder="Verify new password">
              </div>
            </div>
            <div class="columns">
              <div class="column">
                <Button class="button is-light is-large is-fullwidth" @click='Update' v-bind:class="{
                'is-loading': state.saving,
                'is-success': state.saved,
                'is-danger': state.error }"
                type="button" :disabled="isDisabled">Save</Button>
              </div>
              <div class="column">
                <Button class="button is-danger is-large is-fullwidth" @click='state.deleteMsg = !state.deleteMsg' type="button" >Delete account</Button>
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
        verifyPassword: '',
        error: '',
        state: {
          error: false,
          saving: false,
          saved: false,
          pwned: false,
          notEqual: false,
          deleteMsg: false
        }
      }
    },
    created () {
      this.Account()
    },
    computed: {
      isDisabled:function() {
        pwned(this.$data.newUser.password).then(isPwned => {
          this.$data.state.pwned = isPwned
        })

        if (this.$data.verifyPassword && (this.$data.newUser.password !== this.$data.verifyPassword)) {
          this.$data.state.notEqual = true
        } else {
          this.$data.state.notEqual = false
        }
        
        const stuffToEdit = (this.$data.newUser.password || this.$data.newUser.username) ? true : false
        
        return (stuffToEdit && !(this.$data.state.pwned || this.$data.state.notEqual)) ? false : true
      }
    },
    methods: {
      async Account() {
        Api().get(`/api/v1/account`, {})
        .then( response => {
          if (response.status === 200) {
            // get correct user from array
            this.user = response.data
          }
        })
        .catch(e => {
          this.$data.error = e
          console.error(e)
        })
      },
      Update() {
        this.state.saved = false
        this.state.saving = true
        const user = this.$data.newUser
        Api().post(`/api/v1/account`, {
          user
        })
        .then(response => {
          this.user = response.data
          this.state.saved = true
          this.state.saving = false
          this.state.error = false
          this.newUser = {}
        })
        .catch(e => {
          this.$data.error = e
          console.error(e)
          this.state.error = true
          this.state.saving = false
        })
      },
      Delete() {
        Api().delete(`/api/v1/account/delete`)
        .then(response => {
          if (response.status === 200) {
            localStorage.clear()
            this.$parent.isAuthenticated = false
            this.$parent.isAdmin = false
            this.$router.push('/login')
          }
        })
        .catch(e => {
        this.$data.error = e
        console.error(e)
        })
      }
    }
  }
</script>
