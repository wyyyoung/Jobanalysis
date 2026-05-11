import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CityHeatmap from '../views/CityHeatmap.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/city-heatmap',
    name: 'CityHeatmap',
    component: CityHeatmap
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router