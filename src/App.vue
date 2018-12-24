<template>
  <div id="app">
    <router-view/>
    <footer class="footer">
      <div class="columns">
        <div class="column">
          <a href="https://github.com/bierteam">
            &copy; BierTeam 2018
          </a>
          <p>The source code is licensed
            <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
          </p>
        </div>
        <div class="column">
          <p>
            <a href="https://bulma.io">
              <img src="./assets/made-with-bulma.png" alt="Made with Bulma" width="128" height="24">
            </a>
          </p>
          <p>
            <a href="http://www.w3.org/html/logo/">
              <img src="https://www.w3.org/html/logo/badge/html5-badge-h-css3-semantics.png" width="83" height="32" alt="HTML5 Powered with CSS3 / Styling, and Semantics" title="HTML5 Powered with CSS3 / Styling, and Semantics">
            </a>
          </p>
          <p>
            <a href="https://github.com/standard/standard">
              <img src="https://cdn.rawgit.com/standard/standard/master/badge.svg" alt="Made with standard" width="70" height="13">
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
