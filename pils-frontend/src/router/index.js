import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home.vue'
import Discounts from '@/components/Discounts.vue'
import Register from '@/components/Register.vue'
import Login from '@/components/Login.vue'
import Users from '@/components/Users.vue'
import Account from '@/components/Account.vue'
import User from '@/components/User.vue'
import Import from '@/components/Import.vue'
import Storemapping from '@/components/Storemapping.vue'
import Logging from '@/components/Logging.vue'
import NotFound from '@/components/NotFound.vue'

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
