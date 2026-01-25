import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    /* =====================
       PÚBLICAS
    ====================== */

    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },

    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },

    /**
     * Página pública
     * /mpaulina-arias-udea/meetings/30min
     */
    {
      path: '/:slug/meetings/30min',
      name: 'public-meeting-30min',
      component: () => import('@/views/meetings/Meetings30minView.vue'),
      props: true,
    },

    /* =====================
       PRIVADAS (DASHBOARD)
    ====================== */

    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardHome.vue'),
      meta: { requiresAuth: true },
    },

    {
      path: '/dashboard/profile',
      name: 'profile',
      component: () => import('@/views/dashboard/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard/public-link',
      name: 'public-link',
      component: () => import('@/views/dashboard/SetPublicLinkView.vue'),
      meta: { requiresAuth: true },
    },

    {
      path: '/availability',
      name: 'availability',
      component: () => import('@/views/dashboard/AvailabilityView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

export default router
