<template>
    yassss
    <br>
  <body>
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <div v-if="isPwned" class="notification is-warning">
              This password has been pwned.
          </div>
          <div v-if="error" class="notification is-danger">
            <button class="delete" @click="error = ''"></button>
              {{error}}
          </div>
          <h3 class="title has-text-grey">Edit</h3>
          <div class="box">
            <form>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.username" type="email" :placeholder="user.username">
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
            <Button class="button is-light is-large is-fullwidth" @click='Update' v-bind:class="{
              'is-loading': isSaving,
              'is-success': isSaved,
              'is-danger': isError }"
              type="button" :disabled="isDisabled">Save</Button>
            <Button class="button is-danger is-large is-fullwidth" @click='sure = !sure' type="button" >Delete</Button>
            <div v-if="sure" class="notification is-light">
              <button class="delete" @click="sure = ''"></button>
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
        message: '',
        error: '',
        isSaving: false,
        isSaved: false,
        isError: false,
        isPwned: false,
        sure: false
      }
    },
    created () {
      this.Users()
    },
    computed: {
      isDisabled:function() {
        pwned(this.$data.newUser.password).then(isPwned => {
          this.$data.isPwned = isPwned
        })
        return (!this.$data.isPwned) ? false : true
      }
    },
    methods: {
      async Users() {
        const _id = this.$route.params.id
        Api().get(`api/v1/users/${_id}`, {})
        .then( response => {
          if (response.status === 200) {
            // get correct user from array
            this.user = response.data
            this.newUser.admin = this.user.admin
          }
        })
        .catch(e => {
          this.$data.error = e
          console.error(e)
        })
      },
      Update() {
        this.isSaved = false
        this.isSaving = true
        const user = this.$data.newUser
        const _id = this.$route.params.id
        Api().post(`api/v1/users/${_id}`, {
          user
        })
        .then(response => {
          this.user = response.data
          this.newUser.admin = this.user.admin
          this.isSaved = true
          this.isSaving = false
          this.isError = false
        })
        .catch(e => {
          this.$data.error = e
          console.error(e)
          this.isError = true
          this.isSaving = false
        })
      },
      Delete() {
        const _id = this.$route.params.id
        Api().delete(`api/v1/users/${_id}`)
        .then(response => {
          if (response.status === 200) {
            this.$router.push('/users')
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
