<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-2">Mi enlace</h1>

    <p class="text-sm text-gray-600 mb-6">
      Si cambia su URL de Calendly, todos sus enlaces copiados dejarán de funcionar y deberán ser
      actualizados.
    </p>

    <form @submit.prevent="confirmSave" class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-gray-500">meet-qanty.com/</span>
        <input
          v-model="slug"
          class="border rounded px-3 py-2 flex-1"
          placeholder="tu-enlace"
          required
        />
      </div>

      <p v-if="error" class="text-red-600 text-sm">
        {{ error }}
      </p>

      <p class="text-sm text-gray-500">
        Ejemplo:
        <br />
        <strong> meet-qanty.web.app/{{ slug || 'tu-enlace' }}/meetings/30min </strong>
      </p>

      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Guardar enlace</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()

const slug = ref('')
const error = ref<string | null>(null)

/**
 * Cargar siempre desde Firestore
 */
onMounted(async () => {
  if (!auth.user) return

  const refDoc = doc(db, 'users', auth.user.uid)
  const snap = await getDoc(refDoc)

  if (snap.exists()) {
    slug.value = snap.data().publicSlug ?? ''
  }
})

/**
 * Confirmación
 */
const confirmSave = async () => {
  const ok = window.confirm(
    'Si cambia su URL de Calendly, todos sus enlaces copiados dejarán de funcionar y deberán ser actualizados.',
  )

  if (!ok) return

  await save()
}

/**
 * Guardado real
 */
const save = async () => {
  if (!auth.user) return
  error.value = null

  const cleanSlug = slug.value.trim()

  if (!cleanSlug) {
    error.value = 'El enlace no puede estar vacío'
    return
  }

  // verificar unicidad
  const q = query(collection(db, 'users'), where('publicSlug', '==', cleanSlug))

  const snap = await getDocs(q)

  const conflict = snap.docs.some((d) => d.id !== auth.user!.uid)

  if (conflict) {
    error.value = 'Este enlace ya está en uso'
    return
  }

  const refDoc = doc(db, 'users', auth.user.uid)

  await updateDoc(refDoc, {
    publicSlug: cleanSlug,
  })

  // sync store
  auth.user.publicSlug = cleanSlug

  alert('Enlace actualizado correctamente')
}
</script>
