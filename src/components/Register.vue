<template>

<body>
  <section class="hero is-fullheight">
    <div class="hero-body">
      <div class="container has-text-centered">
        <div class="column is-4 is-offset-4">
          <h3 class="title has-text-grey">Register</h3>
          <p class="subtitle has-text-grey">Create a new user.</p>
          <div class="box">
            <form>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="email" type="email" placeholder="Their email" autofocus="">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="password" type="password" placeholder="Their password">
              </div>
            </div>
            <button class="button is-block is-info is-large is-fullwidth" @click='Post' :disabled="isDisabled">Register new account</button>
            </form>
          </div>
          <p class="has-text-grey">
          <a href="../">Login</a> &nbsp;·&nbsp;
          <a href="../">Need Help?</a>
          </p>
        </div>
      </div>
    </div>
  </section>
</body>
</template>

<script>
  import Api from '@/services/Api'

  export default {
    data() {
      return {
        email: '',
        password: '',
      }
    },
    computed: {
      isDisabled:function() {
        if (!this.$data.email || !this.$data.password){
          return true
        }
      }
    },
    methods: {
      Post() {
        const email = this.$data.email
        const password = this.$data.password
        Api().post(`api/v1/register`, {
          email, password
        })
        .then( response => {
          if (response.status === 201) {
            alert('succes')
          } else if (response.status === 200) {
            alert(response.data)
          }
        })
        .catch(e => {
          console.error(e)
        })
      }
    }
  }
</script>
