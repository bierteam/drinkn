import Vue from 'vue'
import Router from 'vue-router'
import aanbiedingen from '@/components/aanbiedingen'

Vue.use(Router)

export default new Router({
  routes: [,
    {
      path: '/',
      name: 'aanbiedingen',
      component: aanbiedingen
    }
  ]
})
