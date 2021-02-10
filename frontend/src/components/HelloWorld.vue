<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <b-alert v-if="message" show variant="info" dismissible>{{message}}</b-alert>
    <b-alert v-if="error" show variant="danger" dismissible>{{error}}</b-alert>
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
