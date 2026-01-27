<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { onMounted, onUnmounted } from 'vue'

function handleResize() {
  collapsed.value = window.innerWidth < 1024
}

onMounted(() => {
  handleResize() // estado inicial
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const title = computed(() => route.meta.title as string)
const section = computed(() => route.meta.section as string)

const open = ref(false)

const goTo = (path: string) => {
  open.value = false
  router.push(path)
}

const goMainMenu = () => router.push('/dashboard')

const collapsed = ref(false)

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div class="layout">
    <!-- SIDEBAR -->
    <aside :class="['sidebar', { collapsed }]">
      <div class="sidebar-top">
        <h2 v-if="!collapsed" class="logo">MeetQanty</h2>

        <button
          class="collapse-btn"
          :title="collapsed ? 'Expandir menú' : 'Colapsar menú'"
          @click="toggleSidebar"
        >
          <i :class="collapsed ? 'bi bi-layout-sidebar-inset' : 'bi bi-layout-sidebar'"></i>
        </button>
      </div>

      <!-- MENÚ PRINCIPAL -->
      <template v-if="section === 'main'">
        <RouterLink to="/dashboard" class="menu-item" exact-active-class="active">
          <i class="bi bi-house-door"></i>
          <span v-if="!collapsed">Inicio</span>
        </RouterLink>

        <RouterLink to="/dashboard/scheduling" class="menu-item" exact-active-class="active">
          <i class="bi bi-calendar-event"></i>
          <span v-if="!collapsed">Programación</span>
        </RouterLink>

        <RouterLink to="/dashboard/availability" class="menu-item" exact-active-class="active">
          <i class="bi bi-clock"></i>
          <span v-if="!collapsed">Disponibilidad</span>
        </RouterLink>
      </template>

      <!-- MENÚ CUENTA -->
      <template v-else>
        <button class="back-btn" @click="goMainMenu">
          <i class="bi bi-chevron-left"></i>
          <span v-if="!collapsed"> Volver al inicio</span>
        </button>

        <RouterLink to="/dashboard/profile" class="menu-item" active-class="active">
          <i class="bi bi-person"></i>
          <span v-if="!collapsed">Mi perfil</span>
        </RouterLink>

        <RouterLink to="/dashboard/public-link" class="menu-item" active-class="active">
          <i class="bi bi-link-45deg"></i>
          <span v-if="!collapsed">Mi enlace</span>
        </RouterLink>

        <div class="sidebar-bottom">
          <button class="danger-btn" @click="auth.logout()">
            <i class="bi bi-arrow-left"></i>
            <span v-if="!collapsed"> Cerrar sesión</span>
          </button>
        </div>
      </template>
    </aside>

    <!-- MAIN -->
    <div class="main">
      <header class="topbar">
        <h1>{{ title }}</h1>

        <div class="user-menu">
          <button class="user-btn" @click="open = !open">
            {{ auth.user?.email }}
          </button>

          <div v-if="open" class="dropdown">
            <button @click="goTo('/dashboard/profile')">
              <i class="bi bi-person"></i> Mi perfil
            </button>
            <button @click="goTo('/dashboard/public-link')">
              <i class="bi bi-link-45deg"></i> Mi enlace
            </button>
            <div style="height: 1px; background: #e5e7eb; margin: 6px 0"></div>
            <button @click="auth.logout()"><i class="bi bi-arrow-left"></i> Cerrar sesión</button>
          </div>
        </div>
      </header>

      <div class="page">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/layout.css';
</style>
