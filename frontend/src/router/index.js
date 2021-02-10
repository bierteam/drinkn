import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

Vue.use(VueRouter)

// https://next.router.vuejs.org/guide/advanced/lazy-loading.html#grouping-components-in-the-same-chunk
const routes = [
  {
    path: '/',
    name: 'home',
    meta: {
      requiresAuth: true
    },
    component: () => import(/* webpackChunkName: "home" */ '@/components/HelloWorld.vue')
  },
  {
    path: '/cocktail',
    name: 'cocktail',
    meta: {
      requiresAuth: true
    },
    component: () => import(/* webpackChunkName: "cocktail" */ '@/components/Cocktail.vue')
  },
  {
    path: '/login',
    name: 'login',
    meta: {
      guest: true
    },
    component: () => import(/* webpackChunkName: "auth" */ '@/components/Login.vue')
  // },
  // { path: '/signin', redirect: '/login' },
  // {
  //   path: '/register',
  //   name: 'Register',
  //   meta: {
  //     guest: true
  //   },
  //   component: () => import(/* webpackChunkName: "auth" */ '@/components/Register.vue')
  }

]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (store.state.jwt === '') {
      next({
        name: 'login',
        params: { nextUri: to.fullPath }
      })
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.guest)) {
    if (store.state.jwt === '') {
      next()
    } else {
      next({ name: 'home' })
    }
  } else {
    next()
  }
})

export default router
