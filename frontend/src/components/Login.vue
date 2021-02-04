<template>
  <div>
    <b-form @submit.prevent="onSubmit()" v-on:keydown.enter.prevent="onSubmit()">
      <b-form-group id="input-group-1" label="Username:" label-for="input-1">
        <b-form-input
          id="input-1"
          v-model="form.username"
          type="text"
          required
          placeholder="Enter username"
        ></b-form-input>
        <b-form>
          <label for="text-password">Password:</label>
          <b-input
            type="password"
            id="text-password"
            aria-describedby="password-help-block"
            v-model="form.password"
            placeholder="Enter password"
          ></b-input>
        </b-form>
      </b-form-group>
      <b-button type="submit" variant="primary">Submit</b-button>
    </b-form>
  </div>
</template>

<script>
import { mutations } from '@/store'
import { httpClient } from '@/services/httpclient' 
export default {
  data() {
    return {
      form: {
        username: "",
        password: ""
      },
      response: ""
    };
  },
  methods: {
    onSubmit() {
      httpClient.postForm(this.form)
        .then(response => (mutations.setJwt(response.data.jwt), this.setCookie(response.data.refreshToken)))
    },
    setCookie(refreshToken){
      location.protocol === "https:" ? window.$cookies.set('refreshToken', refreshToken,'7d',null,null,true,'None') : window.$cookies.set('refreshToken', refreshToken)
    }
  }
};
</script>


<style>
body {
  text-align: center;
}
form {
  display: inline-block;
}
</style>
