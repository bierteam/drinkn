<template>
  <div class="container">
    <h1>Welcome to your Pils App</h1>
    <br>
    <li><router-link to="/aanbiedingen">Aanbiedingen</router-link></li>
    <li><router-link to="/import">Import</router-link></li>
    <li><router-link to="/register">Register</router-link></li>
    <li><router-link to="/users">Users</router-link></li>
    <li><router-link to="/storemapping">Storemapping</router-link></li>
    <li><router-link to="/logging">Logging</router-link></li>
    <br>
    <br>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
