import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/HelloWorld'
import Aanbiedingen from '@/components/Aanbiedingen'
import Login from '@/components/Login'

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
      component: Aanbiedingen
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    }
  ]
})
