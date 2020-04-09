<template>
  <div>
    <b-form @submit.prevent="onSubmit" @keydown.enter.prevent="onSubmit" >
      <b-form-group id="input-group-1" label="Username:" label-for="input-1">
        <b-form-input
          id="input-1"
          v-model="form.email"
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
    <span>{{ errormsg }} </span>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      form: {
        username: "",
        password: ""
      },
      response: "",
      errormsg: ""
    };
  },
  methods: {
    onSubmit() {
      axios
        .post("http://localhost:3000/api/v2/auth/login", {username : this.form.email, password : this.form.password})
        .then(response => {
          if(response.status == 200){
            this.$cookie.set('token', response.data)
            window.location.href = "http://localhost:8080/cocktail"
          } else {
            this.errormsg = "Failed to login"
          }
        })
        .catch(function(error){
          this.errormsg = error
        });
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
