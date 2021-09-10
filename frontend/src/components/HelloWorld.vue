<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div v-if="message" class="alert alert-info alert-dismissible fade show" role="alert">
      {{message}}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{error}}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    <button type="button" class="btn btn-primary" @click="logJWT">log jwt</button>
    <button type="button" class="btn btn-primary" @click="resetJWT">Delete jwt</button>
    <button type="button" class="btn btn-primary" @click="check">Check login</button>
    <button type="button" class="btn btn-primary" @click="logout">logout</button>
    <button type="button" class="btn btn-primary" @click="logoutAll">logout all</button>
  </div>
</template>

<script>
  import Api from '@/services/Api'

  export default {
    data () { // local data
      return {
        error: '',
        message: ''
      }
    },
    name: 'HelloWorld',
    props: {
      msg: String
    },
    methods: {
      logJWT () {
        console.log(this.$store.state.jwt)
        console.log(this.$store.getters.decodedJWT)
        this.$data.message = 'Logged JWT to console'
      },
      resetJWT () {
        this.$store.commit('saveJWT', "")
        this.$data.message = 'Deleted JWT'
        console.log('Deleted JWT')
      },
      check () {
        Api().get('auth/check')
          .then(response => {
            console.log(response.status)
            this.$data.message = response.status
          })
          .catch(e => {
            this.$data.error = e.response.data || e
            console.error(e)
          })
      },
      logout () {
        Api().delete('auth/logout')
          .then(response => {
            console.log(response.status)
            this.$data.message = response.status
          })
          .catch(e => {
            this.$data.error = e.response.data || e
            console.error(e)
          })
      },
      logoutAll () {
        Api().delete('auth/logout/all')
          .then(response => {
            console.log(response.status)
            this.$data.message = response.status
          })
          .catch(e => {
            this.$data.error = e.response.data || e
            console.error(e)
          })
      },
    }
  }
</script>
