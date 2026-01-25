<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Perfil</h1>

    <div v-if="auth.loading">Cargando...</div>

    <form v-else class="space-y-6" @submit.prevent="save">
      <!-- Avatar -->
      <div>
        <label class="block font-medium mb-1">Avatar</label>
        <img v-if="form.photoUrl" :src="form.photoUrl" class="w-20 h-20 rounded-full mb-2" />
        <p class="text-sm text-gray-500">La imagen viene del proveedor (Google / Microsoft)</p>
      </div>

      <!-- Nombre -->
      <div>
        <label class="block font-medium mb-1">Nombre</label>
        <input
          :value="auth.user?.name"
          type="text"
          class="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <!-- Email -->
      <div>
        <label class="block font-medium mb-1">Email</label>
        <input
          :value="auth.user?.email"
          disabled
          class="w-full border rounded px-3 py-2 bg-gray-100"
        />
      </div>

      <!-- Zona horaria -->
      <div>
        <label class="block font-medium mb-1">Zona horaria</label>
        <select :value="auth.user?.timezone" class="w-full border rounded px-3 py-2">
          <option v-for="tz in timezones" :key="tz" :value="tz">
            {{ tz }}
          </option>
        </select>
      </div>

      <div class="flex gap-3">
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
          Guardar cambios
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()

const form = ref({
  name: '',
  photoUrl: '',
  timezone: '',
})

const timezones = Intl.DateTimeFormat().resolvedOptions().timeZone
  ? [Intl.DateTimeFormat().resolvedOptions().timeZone]
  : ['UTC']

onMounted(() => {
  if (!auth.user) return

  form.value = {
    name: auth.user.name,
    photoUrl: auth.user.photoUrl ?? '',
    timezone: auth.user.timezone,
  }
})

const save = async () => {
  if (!auth.user) return

  const refDoc = doc(db, 'users', auth.user.uid)

  await updateDoc(refDoc, {
    name: form.value.name,
    timezone: form.value.timezone,
  })

  // sync local store
  auth.user.name = form.value.name
  auth.user.timezone = form.value.timezone

  alert('Perfil actualizado')
}
</script>
