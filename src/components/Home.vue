<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <h3>Pils</h3>
    <li><a href="#/aanbiedingen">Aanbiedingen</a></li>
    <li><a href="#/import">Import</a></li>
    <li><a href="#/login">Login</a></li>
    <li><a href="#/storemapping">Storemapping</a></li>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

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
