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
  <div class="view-container">
    <!-- HEADER / BIENVENIDA -->
    <div class="view-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <img v-if="auth.user?.photoUrl" :src="auth.user.photoUrl" alt="Avatar" class="avatar" />

        <div>
          <h1 class="page-title mb-0">Hola, {{ auth.user?.name }}</h1>
          <p class="subtitle mb-0">
            {{ auth.user?.email }}
          </p>
        </div>
      </div>
    </div>

    <!-- ACCIONES PRINCIPALES -->
    <section class="card">
      <div class="card-header">Comienza aquí</div>

      <div class="card-body">
        <div class="row g-3">
          <!-- Acción principal -->
          <div class="col-12 col-md-6 col-lg-4">
            <RouterLink to="/dashboard/availability" class="quick-link-card h-100">
              <i class="bi bi-clock ql-icon"></i>
              <div>
                <div class="day-name">Configurar disponibilidad</div>
                <p class="muted mb-0">Define tus horarios laborales</p>
              </div>
            </RouterLink>
          </div>

          <!-- Próximamente -->
          <div class="col-12 col-md-6 col-lg-4">
            <div class="quick-link-card h-100 opacity-50 pe-none">
              <i class="bi bi-calendar3 ql-icon"></i>
              <div>
                <div class="day-name">Ver reservas</div>
                <p class="muted mb-0">Próximamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
