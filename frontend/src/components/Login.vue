<template>
  <div>
    <form class="form-signin">
      <div class="text-center mb-4">
        <img class="mb-4" alt="Household logo" width="100" height="100" src="../assets/drinks.svg">
        <!-- <div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div> -->
        <h1 class="h3 mb-3 font-weight-normal">Drinkn</h1>
      </div>
      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{error}}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
      <div class="form-label-group">
        <input type="username" id="inputUsername" class="form-control" placeholder="Username" v-model="username" required autofocus>
        <label class="text-left" for="inputUsername">Username</label>
      </div>
      <div class="form-label-group">
        <input type="password" id="inputPassword" class="form-control" placeholder="Password" v-model="password" required>
        <label class="text-left" for="inputPassword">Password</label>
      </div>
      <button @click.prevent="Login" class="btn btn-lg btn-primary btn-block" type="submit">Log in</button>
      <div class="text-center">
        <br>
        <router-link :to="{ name: 'Register', params: { nextUri: this.$route.params.nextUri }}">Or register if you don't have an account yet</router-link>
      </div>
      <p class="mt-5 mb-3 text-muted text-center">&copy; 2021 BierTeam</p>
    </form>
  </div>
</template>

<script>
  import Api from '@/services/Api'

  export default {
    data () { // local data
      return {
        username: '',
        password: '',
        error: '',
        message: ''
      }
    },
    methods: {
      Login () {
        const data = {
          username: this.$data.username,
          password: this.$data.password
        }
        Api().post('auth/login', data)
          .then(response => {
            if (response.status === 200) {
              this.$store.commit('saveJWT', response.data.jwt)
              this.$router.push((this.$route.params.nextUri) ? { path: this.$route.params.nextUri } : '/')
            }
          })
          .catch(e => {
            this.$data.error = e.response.data || e
            console.error(e)
          })
      }
    },
    beforeCreate: function () {
      Api().get('auth/refresh')
      .then(response => {
        if (response.status === 200) {
          this.$store.commit('saveJWT', response.data.jwt)
          this.$router.push((this.$route.params.nextUri) ? { path: this.$route.params.nextUri } : '/')
        }
      })
      .catch(e => {
        console.error(e)
      })
    }
  }
</script>

<style scoped>
  html,
  body {
    height: 100%;
  }

  body {
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
    align-items: center;
    padding-top: 40px;
    padding-bottom: 40px;
    background-color: #f5f5f5;
  }

  .form-signin {
    width: 100%;
    max-width: 420px;
    padding: 15px;
    margin: auto;
  }

  .form-label-group {
    position: relative;
    margin-bottom: 1rem;
  }

  .form-label-group > input,
  .form-label-group > label {
    height: 3.125rem;
    padding: .75rem;
  }

  .form-label-group > label {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    margin-bottom: 0;
    line-height: 1.5;
    color: #495057;
    pointer-events: none;
    cursor: text;
    border: 1px solid transparent;
    border-radius: .25rem;
    transition: all .1s ease-in-out;
  }

  .form-label-group input::-webkit-input-placeholder {
    color: transparent;
  }

  .form-label-group input:-ms-input-placeholder {
    color: transparent;
  }

  .form-label-group input::-ms-input-placeholder {
    color: transparent;
  }

  .form-label-group input::-moz-placeholder {
    color: transparent;
  }

  .form-label-group input::placeholder {
    color: transparent;
  }

  .form-label-group input:not(:placeholder-shown) {
    padding-top: 1.25rem;
    padding-bottom: .25rem;
  }

  .form-label-group input:not(:placeholder-shown) ~ label {
    padding-top: .25rem;
    padding-bottom: .25rem;
    font-size: 12px;
    color: #777;
  }
</style>
