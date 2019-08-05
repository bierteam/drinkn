import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Discounts from '@/components/Discounts'
import Register from '@/components/Register'
import Login from '@/components/Login'
import Users from '@/components/Users'
import Account from '@/components/Account'
import User from '@/components/User'
import Import from '@/components/Import'
import Storemapping from '@/components/Storemapping'
import Logging from '@/components/Logging'
import NotFound from '@/components/NotFound'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: Home },
    { path: '/discounts', component: Discounts },
    { path: '/register', component: Register },
    { path: '/login', component: Login },
    { path: '/users', component: Users },
    { path: '/account', component: Account },
    { path: '/users/:id', component: User },
    { path: '/import', component: Import },
    { path: '/storemapping', component: Storemapping },
    { path: '/logging', component: Logging },
    { path: '*', component: NotFound }
  ]
})
