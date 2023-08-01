// require('babel-register')
// http://nightwatchjs.org/gettingstarted#settings-file
module.exports = {
  src_folders: ['test/e2e/specs'],
  output_folder: 'test/e2e/reports',
  custom_assertions_path: ['test/e2e/custom-assertions'],

  // test_workers: { // Parallel tests
  //   enabled: true,
  //   workers: 'auto'
  // },

  selenium: {
    start_process: true,
    server_path: require('selenium-server').path,
    host: '127.0.0.1',
    port: 4444,
    cli_args: {
      'webdriver.chrome.driver': require('chromedriver').path
    }
  },

  // TODO https://stackoverflow.com/questions/55919811/timeout-while-trying-to-connect-to-selenium-server-on-port-4444-testing-with-ni
  test_settings: {
    default: { // This gets inherrited by all other envirioments
      selenium_port: 4444,
      selenium_host: 'localhost',
      silent: true,
      globals: {
        devServerURL:
          'http://localhost:' + (Number(process.env.PORT) || 3000)
      }
    },

    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: { w3c: false },
        javascriptEnabled: true,
        acceptSslCerts: true
      }
    },

    firefox: {
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true,
        acceptSslCerts: true
      }
    }
  }
}
