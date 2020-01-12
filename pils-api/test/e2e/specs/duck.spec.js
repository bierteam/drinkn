module.exports = {
  // '@disabled': true,
  before (browser) {
    browser.maximizeWindow()
  },
  'Test duck.com': function (browser) {
    browser
      .url('https://duck.com/')
      .waitForElementVisible('body')
      .assert.titleContains('DuckDuckGo')
      .element('css selector', '.js-badge-link-skip', function (result) {
        if (result.value) this.click('.js-badge-link-skip')
      })
      .assert.visible('#search_form_input_homepage')
      .setValue('#search_form_input_homepage', 'pils.oscarr.nl')
      .assert.visible('#search_button_homepage')
      .click('#search_button_homepage')
      .assert.containsText('.js-results', 'pils.oscarr.nl')
      .end()
  }
}
