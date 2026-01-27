<template>
  <div class="view-container">
    <!-- HEADER -->
    <div class="view-header">
      <div>
        <p class="subtitle">Administra tu información personal y configuración pública</p>
      </div>
    </div>

    <div v-if="auth.loading">Cargando perfil…</div>

    <!-- PERFIL -->
    <form v-else @submit.prevent="save" class="card">
      <div class="card-body">
        <!-- AVATAR -->
        <section class="row-between">
          <div class="user-welcome">
            <img :src="form.photoUrl || '/avatar-placeholder.png'" class="avatar-lg" />
            <div>
              <div class="label">Foto de perfil</div>
            </div>
          </div>
        </section>

        <hr />

        <!-- INFORMACIÓN PERSONAL -->
        <section>
          <div class="section-title">Información personal</div>

          <div class="form-group">
            <label class="label">Nombre</label>
            <input v-model="form.name" type="text" class="select" required />
          </div>

          <div class="form-group">
            <label class="label">Email</label>
            <input :value="auth.user?.email" disabled class="select input disabled" />
            <span class="helper"> El correo no se puede modificar </span>
          </div>
        </section>

        <!-- PERFIL PÚBLICO -->
        <section>
          <div class="section-title">Perfil público</div>

          <div class="form-group">
            <label class="label">Mensaje de bienvenida</label>
            <textarea
              v-model="form.welcomeMessage"
              rows="3"
              class="select"
              placeholder="Se mostrará en tu página pública"
            />
          </div>

          <div class="form-group">
            <label class="label">Zona horaria</label>
            <select v-model="form.timezone" class="select">
              <option v-for="tz in timezones" :key="tz" :value="tz">
                {{ tz }}
              </option>
            </select>
          </div>
        </section>

        <!-- ACTIONS -->
        <div class="actions-bar end">
          <button type="submit" class="primary-btn">Guardar cambios</button>
        </div>
      </div>
    </form>

    <!-- ZONA DE PELIGRO -->
    <div class="card danger-zone">
      <div class="card-body">
        <p class="helper">
          Esta acción eliminará permanentemente tu cuenta y no se puede deshacer.
        </p>

        <button @click="confirmDelete" class="danger-btn">Eliminar cuenta</button>
      </div>
    </div>
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
