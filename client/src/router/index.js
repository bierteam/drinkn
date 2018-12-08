import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/HelloWorld'
import Aanbiedingen from '@/components/Aanbiedingen'

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
      name: 'Aanbiedingen',
      component: Aanbiedingen
    }
  ]
})
