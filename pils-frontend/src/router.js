import { createRouter, createWebHistory } from 'vue-router'
import { store } from './store.js'

export const Router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/discounts' },
    { path: '/home', component: () => import('./components/Home.vue') },
    { path: '/discounts', component: () => import('./components/Discounts.vue') },
    // { path: '/discounts/:id', component: () => import('./components/Discount.vue') },
    { path: '/register', component: () => import('./components/Register.vue') },
    { path: '/login', component: () => import('./components/Login.vue') },
    { path: '/users', component: () => import('./components/Users.vue') },
    { path: '/account', component: () => import('./components/Account.vue') },
    { path: '/users/:id', component: () => import('./components/User.vue') },
    { path: '/import', component: () => import('./components/Import.vue') },
    { path: '/storemapping', component: () => import('./components/Storemapping.vue') },
    { path: '/logging', component: () => import('./components/Logging.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('./components/NotFound.vue') }
  ]
})

Router.beforeEach(async (to, from) => {
  if (!store.isAuthenticated && to.path !== '/login') {
    return { path: '/login' }
  }
})
