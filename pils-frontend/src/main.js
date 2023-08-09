import { createApp } from 'vue'
import { Router } from './router'
import App from './App'
import browserUpdate from 'browser-update'

const app = createApp(App)
app.use(Router)
app.mount('#app')

// https://browser-update.org/customize.html
browserUpdate({
  required: {
    e: -1,
    f: -1,
    o: -1,
    s: -1,
    c: -1
  },
  // test: true,
  insecure: true,
  no_permanent_hide: true,
  unsupported: true
})
