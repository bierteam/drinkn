<template>
  <div class="has-text-centered">
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <!-- <a class="navbar-item" href="#/">
          <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28">
        </a> -->

        <a role="button" class="navbar-burger burger" @click="burger = !burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample" v-bind:class="{'is-active': burger}">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navbarBasicExample" class="navbar-menu" v-bind:class="{'is-active': burger}">
        <div class="navbar-start">
          <router-link class="navbar-item" to="/">Home</router-link>
          <router-link class="navbar-item" to="/aanbiedingen">Aanbiedingen</router-link>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">
              More
            </a>

            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/import">Import</router-link>
              <router-link class="navbar-item" to="/storemapping">Map store names</router-link>
              <router-link class="navbar-item" to="/">Contact</router-link>

              <hr class="navbar-divider">
              <a class="navbar-item" href="https://github.com/bierteam/Pils/tree/master/docs">
                Documentation
              </a>
            </div>
          </div>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="buttons">
              <router-link class="button is-primary" to="/">Sign up</router-link>
              <router-link class="button is-light" to="login">Log in</router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

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
              <img src="./assets/made-with-bulma--semiblack.png" alt="Made with Bulma" width="128" height="24"></img>
            </a>
          </p>
          <p>
            <a href="http://www.w3.org/html/logo/">
              <img src="https://www.w3.org/html/logo/badge/html5-badge-h-css3-semantics.png" width="83" height="32" alt="HTML5 Powered with CSS3 / Styling, and Semantics" title="HTML5 Powered with CSS3 / Styling, and Semantics"></img>
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
// addToHomescreen();


export default {
  name: 'App',
  data() {
    return {
      burger: false
    }
  }
}

</script>

<style>
/* .wrapper { min-height: 100%; height: auto !important; height: 100%; margin: 0 auto -30px; }
.footer, #push { height:20px;} */
/* .footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 60px;
    } */
</style>
