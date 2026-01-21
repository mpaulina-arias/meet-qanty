<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import { watch } from 'vue'

const authStore = useAuthStore()
const router = useRouter()

const handleGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle()
  } catch (error) {
    console.error('Login failed', error)
  }
}

// Si el usuario ya está autenticado, redirige
watch(
  () => authStore.user,
  (user) => {
    if (user) {
      router.push({ name: 'dashboard' })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">Quanty Schedule</h1>
      <p class="subtitle">Inicia sesión para configurar tu disponibilidad y compartir tu agenda</p>

      <button class="google-btn" :disabled="authStore.loading" @click="handleGoogleLogin">
        <span v-if="!authStore.loading">Continuar con Google</span>
        <span v-else>Iniciando sesión...</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6f9;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 2rem;
}

.google-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: none;
  background-color: #4285f4;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.google-btn:hover {
  background-color: #357ae8;
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
