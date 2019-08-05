<template>
  <div class="container">
    <h1>Welcome to the Pils App!</h1>
    <br>
    Maybe you are looking for some 
    <router-link to="/discounts">discounts</router-link>
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
