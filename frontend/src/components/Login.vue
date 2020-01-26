<template>
  <div>
    <b-form @submit="onSubmit">
      <b-form-group id="input-group-1" label="Email address:" label-for="input-1">
        <b-form-input
          id="input-1"
          v-model="form.email"
          type="email"
          required
          placeholder="Enter email"
        ></b-form-input>
        <b-form>
          <label for="text-password">Password:</label>
          <b-input
            type="password"
            id="text-password"
            aria-describedby="password-help-block"
            v-model="form.password"
          ></b-input>
        </b-form>
      </b-form-group>
      <b-button type="submit" variant="primary">Submit</b-button>
    </b-form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      form: {
        email: "",
        password: ""
      },
      response: ""
    };
  },
  methods: {
    onSubmit(evt) {
      axios
        .post("/api/v2/auth/login", evt)
        .then(response => (this.response = response.data));
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
