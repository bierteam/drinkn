<template>
  <div>
    <table class='container table'>
      <thead>
        <th>Id</th>
        <th>Username</th>
        <th>Admin</th>
      </thead>
      <tbody>
        <tr v-for='user in users'>
          <th>{{user._id}}</th>
          <th>{{user.username}}</th>
          <th><input type="checkbox" disabled :checked="user.admin"></th>

        </tr>
        <tr>
          <th></th>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  import Api from '@/services/Api'

  export default {
    data() {
      return {
        users: [],
        message: '',
        error: ''
      }
    },
    created () {
        this.Users()
    },
    methods: {
      async Users() {
        Api().get(`api/v1/users`, {})
        .then( response => {
          if (response.status === 200) {
            this.users = response.data   
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
