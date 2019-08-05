// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Vue2Filters from 'vue2-filters'
import VueBrowserUpdate from 'vue-browserupdate'
import './../node_modules/bulma/css/bulma.css'
import './../node_modules/bulma-tooltip/dist/css/bulma-tooltip.min.css'
// import './../node_modules/@fortawesome/fontawesome-free/css/all.css'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})

var Vue2FiltersConfig = {
  capitalize: {
    onlyFirstLetter: true
  },
  currency: {
    symbol: '€',
    decimalDigits: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    symbolOnLeft: true,
    spaceBetweenAmountAndSymbol: false
  },
  pluralize: {
    includeNumber: false
  },
  ordinal: {
    includeNumber: false
  }
}

Vue.use(Vue2Filters, Vue2FiltersConfig)
Vue.use(VueBrowserUpdate, {
  required: {
    e: -2,
    f: -2,
    o: -2,
    s: -2,
    c: -2
  },
  options: {
    insecure: true,
    unsupported: true
  }
  // test: true
})
