import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Públicas
    { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },

    {
      path: '/:userSlug/meetings/:eventSlug',
      name: 'public-meeting',
      component: () => import('@/views/public/PublicMeetingView.vue'),
    },
    {
      path: '/:userSlug/meetings',
      name: 'public-meetings',
      component: () => import('@/views/public/PublicMeetingEventsView.vue'),
    },

    // Dashboard (requires auth)
    {
      path: '/dashboard',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/dashboard/DashboardHome.vue'),
          meta: { title: 'Programación', section: 'main' },
        },
        {
          path: 'scheduling',
          name: 'scheduling',
          component: () => import('@/views/dashboard/SchedulingView.vue'),
          meta: { title: 'Programación', section: 'main' },
        },
        {
          path: 'availability',
          name: 'availability',
          component: () => import('@/views/dashboard/AvailabilityView.vue'),
          meta: { title: 'Disponibilidad', section: 'main' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/dashboard/ProfileView.vue'),
          meta: { title: 'Mi perfil', section: 'account' },
        },
        {
          path: 'public-link',
          name: 'public-link',
          component: () => import('@/views/dashboard/SetPublicLinkView.vue'),
          meta: { title: 'Mi enlace', section: 'account' },
        },
      ],
    },
  ],
})

export default router
