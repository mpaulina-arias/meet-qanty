import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardHome.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/availability',
      name: 'availability',
      component: () => import('@/views/dashboard/AvailabilityView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/meetings30min',
      name: 'meetings30min',
      component: () => import('@/views/meetings/Meetings30minView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

export default router
