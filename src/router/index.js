import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Aanbiedingen from '@/components/Aanbiedingen'
import Login from '@/components/Login'
import Import from '@/components/Import'
import Storemapping from '@/components/Storemapping'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: '/aanbiedingen',
      name: 'Aanbiedingen',
      component: Aanbiedingen
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/import',
      name: 'Import',
      component: Import
    },
    {
      path: '/storemapping',
      name: 'Storemapping',
      component: Storemapping
    }
  ]
})
