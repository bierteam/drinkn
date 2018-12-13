import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/HelloWorld'
import aanbiedingen from '@/components/aanbiedingen'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/aanbiedingen',
      name: 'aanbiedingen',
      component: aanbiedingen
    }
  ]
})
