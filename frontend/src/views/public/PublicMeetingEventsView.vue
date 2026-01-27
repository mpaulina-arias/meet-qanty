<template>
  <div class="page">
    <div class="view-container">
      <!-- Loading -->
      <div v-if="loading" class="muted">Cargando página pública...</div>

      <!-- Usuario no encontrado -->
      <div v-else-if="!user" class="error">Usuario no encontrado</div>

      <!-- Contenido -->
      <div v-else class="card">
        <div class="card-body">
          <!-- Header usuario -->
          <div class="user-public-header">
            <img v-if="user.photoUrl" :src="user.photoUrl" class="avatar-lg" />

            <h1 class="page-title">
              {{ user.name }}
            </h1>

            <p class="muted">
              {{ user.welcomeMessage || 'Selecciona un tipo de reunión para continuar.' }}
            </p>
          </div>

          <!-- Lista de eventos -->
          <div class="public-events">
            <div
              v-for="event in events"
              :key="event.id"
              @click="goToEvent(event.slug)"
              class="public-event-card"
            >
              <div>
                <h2 class="event-name">
                  {{ event.name }}
                </h2>
                <p class="muted">
                  {{ event.duration }} min •
                  {{
                    event.locationType === 'google_meet'
                      ? 'Google Meet'
                      : event.locationType || 'No especificado'
                  }}
                </p>
              </div>

              <i class="bi bi-chevron-right chevron" />
            </div>

            <div v-if="events.length === 0" class="muted text-center">
              Este usuario no tiene reuniones disponibles.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'

/* =========================
   TYPES
========================= */
type PublicUser = {
  id: string
  name: string
  photoUrl?: string
  welcomeMessage?: string
}

type PublicEvent = {
  id: string
  name: string
  slug: string
  duration: number
  locationType: string
  isActive: boolean
}

/* =========================
   STATE
========================= */
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const user = ref<PublicUser | null>(null)
const events = ref<PublicEvent[]>([])

/* =========================
   NAVIGATION
========================= */
const goToEvent = (eventSlug: string) => {
  router.push(`/${route.params.userSlug}/meetings/${eventSlug}`)
}

/* =========================
   LOAD DATA
========================= */
onMounted(async () => {
  const userSlug = route.params.userSlug as string

  try {
    /* Buscar usuario por slug */
    const usersSnap = await getDocs(
      query(collection(db, 'users'), where('publicSlug', '==', userSlug), limit(1)),
    )

    const [userDoc] = usersSnap.docs

    if (!userDoc) {
      loading.value = false
      return
    }

    const userData = userDoc.data()

    user.value = {
      id: userDoc.id,
      name: userData.name,
      photoUrl: userData.photoUrl,
      welcomeMessage: userData.welcomeMessage,
    }

    /*Buscar eventos activos del usuario */
    const eventsSnap = await getDocs(
      query(
        collection(db, 'event_types'),
        where('ownerUid', '==', userDoc.id),
        where('isActive', '==', true),
      ),
    )

    events.value = eventsSnap.docs.map((docSnap) => {
      const data = docSnap.data()

      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        duration: data.duration,
        locationType: data.location?.type ?? null,
        isActive: data.isActive,
      } as PublicEvent
    })
  } catch (error) {
    console.error('Error cargando página pública:', error)
  } finally {
    loading.value = false
  }
})
</script>
