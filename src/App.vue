<template>
  <div class="has-text-centered">
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <!-- <a class="navbar-item" href="#/">
          <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28">
        </a> -->

        <a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navbarBasicExample" class="navbar-menu">
        <div class="navbar-start">
          <a class="navbar-item" href="#/">
            Home
          </a>

          <a class="navbar-item" href="#/aanbiedingen">
            Aanbiedingen
          </a>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">
              More
            </a>

            <div class="navbar-dropdown">
              <a class="navbar-item" href="#/import">
                Import
              </a>
              <a class="navbar-item" href="#/storemapping">
                Map store names
              </a>
              <a class="navbar-item">
                Contact
              </a>
              <hr class="navbar-divider">
              <a class="navbar-item" href="https://github.com/bierteam/Pils/tree/master/docs" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
            </div>
          </div>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="buttons">
              <a class="button is-primary">
                <strong>Sign up</strong>
              </a>
              <a class="button is-light" href="#/login">
                Log in
              </a>
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
export default {
  name: 'App'
}
</script>
