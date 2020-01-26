import Vue from 'vue'
import VueRouter from 'vue-router'
import HelloWorld from '@/components/HelloWorld.vue'
import Cocktail from '@/components/Cocktail.vue'
import Login from '@/components/Login.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HelloWorld
  },
  {
    path: '/cocktail',
    name: 'cocktail',
    component: Cocktail
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  }

]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
