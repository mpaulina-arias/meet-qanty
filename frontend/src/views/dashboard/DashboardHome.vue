<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-home">
    <header class="dashboard-header">
      <div class="user-info">
        <img v-if="auth.user?.photoUrl" :src="auth.user.photoUrl" alt="Avatar" class="avatar" />

        <div>
          <strong>{{ auth.user?.name }}</strong>
          <div class="email">{{ auth.user?.email }}</div>
        </div>
      </div>

      <button class="logout-btn" @click="logout">Cerrar sesión</button>
    </header>

    <main class="dashboard-content">
      <h1>Dashboard</h1>
      <p>Bienvenida 👋</p>

      <!-- Aquí luego pones cards, links, etc -->
      <ul>
        <li>
          <router-link to="/dashboard/availability"> Configurar disponibilidad </router-link>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.email {
  font-size: 0.85rem;
  color: #666;
}

.logout-btn {
  background: transparent;
  border: 1px solid #ccc;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #f5f5f5;
}

.dashboard-content {
  padding: 24px;
}
</style>
