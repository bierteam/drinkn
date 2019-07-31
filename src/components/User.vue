<template>
  <div>
    yassss
    <br>
    {{ this.users[this.users.findIndex(i => i._id === this.$route.params.id)] }}
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
