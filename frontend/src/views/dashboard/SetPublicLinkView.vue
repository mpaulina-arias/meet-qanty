<template>
  <div class="view-container">
    <!-- Header -->
    <div class="view-header">
      <div>
        <p class="subtitle">Personaliza la URL de tu página pública de reservas</p>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <p class="muted">
          Si cambias tu URL, todos los enlaces previamente compartidos dejarán de funcionar y
          tendrán que ser actualizados.
        </p>

        <form @submit.prevent="confirmSave" class="space-y-4">
          <div>
            <div class="label">Tu enlace público</div>
            <div style="display: flex; align-items: center; gap: 8px">
              <span class="muted">meet-qanty.web.app/</span>
              <input
                v-model="slug"
                class="select"
                placeholder="tu-enlace"
                required
                style="flex: 1"
              />
            </div>
          </div>

          <p v-if="error" class="error">
            {{ error }}
          </p>

          <div class="actions-bar" style="margin-top: 32px">
            <button type="submit" class="primary-btn">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()

const slug = ref('')
const error = ref<string | null>(null)

/**
 * Cargar slug desde Firestore
 */
const loadSlug = async () => {
  if (!auth.user) return

  const refDoc = doc(db, 'users', auth.user.uid)
  const snap = await getDoc(refDoc)

  if (snap.exists()) {
    slug.value = snap.data().publicSlug ?? ''
  }
}

/**
 * Intento inicial
 */
onMounted(loadSlug)

/**
 * Reintento cuando auth.user se hidrate
 */
watch(
  () => auth.user,
  (user) => {
    if (user) {
      loadSlug()
    }
  },
  { immediate: true },
)

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
