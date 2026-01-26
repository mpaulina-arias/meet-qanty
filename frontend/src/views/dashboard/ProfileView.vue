<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Perfil</h1>

    <div v-if="auth.loading">Cargando...</div>

    <form v-else class="space-y-6" @submit.prevent="save">
      <!-- Avatar -->
      <div>
        <label class="block font-medium mb-1">Avatar</label>
        <img v-if="form.photoUrl" :src="form.photoUrl" class="w-20 h-20 rounded-full mb-2" />
      </div>

      <!-- Nombre -->
      <div>
        <label class="block font-medium mb-1">Nombre</label>
        <input v-model="form.name" type="text" class="w-full border rounded px-3 py-2" required />
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
        <select v-model="form.timezone" class="w-full border rounded px-3 py-2">
          <option v-for="tz in timezones" :key="tz" :value="tz">
            {{ tz }}
          </option>
        </select>
      </div>

      <!-- Mensaje de bienvenida -->
      <div>
        <label class="block font-medium mb-1">Mensaje de bienvenida</label>
        <textarea
          v-model="form.welcomeMessage"
          rows="3"
          class="w-full border rounded px-3 py-2"
          placeholder="Este mensaje se muestra en tu página pública"
        />
      </div>

      <div class="flex gap-3">
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
          Guardar cambios
        </button>
      </div>

      <hr class="my-10" />

      <div class="bg-red-50 border border-red-200 p-5 rounded-lg">
        <h3 class="text-red-700 font-semibold mb-2">Zona peligrosa</h3>
        <p class="text-sm text-red-600 mb-4">
          Esta acción eliminará tu cuenta y desactivará todos tus eventos públicos.
        </p>

        <button
          @click="confirmDelete"
          class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Eliminar cuenta
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'
import { deleteUser, getAuth } from 'firebase/auth'
import { getTimeZones } from '@/utils/timezones'

const auth = useAuthStore()
const timezones = getTimeZones()

const form = ref({
  name: '',
  photoUrl: '',
  timezone: '',
  welcomeMessage: '',
})

onMounted(() => {
  if (!auth.user) return

  form.value = {
    name: auth.user.name,
    photoUrl: auth.user.photoUrl ?? '',
    timezone: auth.user.timezone,
    welcomeMessage: auth.user.welcomeMessage ?? '',
  }
})

const save = async () => {
  if (!auth.user) return

  const refDoc = doc(db, 'users', auth.user.uid)

  await updateDoc(refDoc, {
    name: form.value.name,
    timezone: form.value.timezone,
    welcomeMessage: form.value.welcomeMessage,
  })

  // sync local store
  auth.user.name = form.value.name
  auth.user.timezone = form.value.timezone
  auth.user.welcomeMessage = form.value.welcomeMessage

  alert('Perfil actualizado')
}

const confirmDelete = async () => {
  if (!auth.user) return

  const ok = confirm(
    '¿Seguro que quieres eliminar tu cuenta?\n\n' +
      '• Se desactivarán todos tus eventos\n' +
      '• Nadie podrá agendar nuevas reuniones\n' +
      '• Esta acción NO se puede deshacer',
  )

  if (!ok) return

  try {
    await deleteAccountFlow()
    alert('Cuenta eliminada correctamente')
  } catch (err) {
    console.error(err)
    alert('Error eliminando la cuenta. Es posible que debas volver a iniciar sesión.')
  }
}

const deleteAccountFlow = async () => {
  if (!auth.user) return

  const uid = auth.user.uid

  /* Desactivar todos los eventos */
  const eventsSnap = await getDocs(
    query(collection(db, 'event_types'), where('ownerUid', '==', uid)),
  )

  const updates = eventsSnap.docs.map((docSnap) => updateDoc(docSnap.ref, { isActive: false }))

  await Promise.all(updates)

  /*  Borrar documento del usuario */
  await deleteDoc(doc(db, 'users', uid))

  /*  Borrar usuario de Firebase Auth */
  const firebaseUser = getAuth().currentUser
  if (firebaseUser) {
    await deleteUser(firebaseUser)
  }

  /* Limpiar estado local */
  auth.user = null

  /* Redirigir al home */
  window.location.href = '/'
}
</script>
