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
import axios from "axios";
import { store, mutations } from '@/store.js'

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
    onSubmit(evt) {
      axios
        .post("/api/v2/auth/login", this.form)
        .then(response => (mutations.setJwt(response.data.jwt)))
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
