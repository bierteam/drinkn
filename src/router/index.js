import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Aanbiedingen from '@/components/Aanbiedingen'
import Login from '@/components/Login'
import Users from '@/components/Users'
import User from '@/components/User'
import Register from '@/components/Register'
import Import from '@/components/Import'
import Storemapping from '@/components/Storemapping'
import Logging from '@/components/Logging'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/home'
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
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/users',
      name: 'Users',
      component: Users
    },
    {
      path: '/users/:id',
      name: 'User',
      component: User
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
    },
    {
      path: '/logging',
      name: 'Logging',
      component: Logging
    }
  ]
})
