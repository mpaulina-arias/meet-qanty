<template>
  <div class="min-h-screen bg-gray-50 py-10 px-4">
    <div class="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
      <!-- Loading -->
      <div v-if="loading" class="text-center text-gray-500">Cargando página pública...</div>

      <!-- Usuario no encontrado -->
      <div v-else-if="!user" class="text-center text-red-600">Usuario no encontrado</div>

      <!-- Contenido -->
      <div v-else>
        <!-- Header usuario -->
        <div class="text-center mb-10">
          <img
            v-if="user.photoUrl"
            :src="user.photoUrl"
            class="w-24 h-24 rounded-full mx-auto mb-4"
          />

          <h1 class="text-2xl font-bold">
            {{ user.name }}
          </h1>

          <p class="text-gray-600 mt-2">
            {{ user.welcomeMessage || 'Selecciona un tipo de reunión para continuar.' }}
          </p>
        </div>

        <!-- Lista de eventos -->
        <div class="space-y-4">
          <div
            v-for="event in events"
            :key="event.id"
            @click="goToEvent(event.slug)"
            class="border rounded-lg p-5 hover:shadow-md hover:border-blue-500 cursor-pointer transition"
          >
            <h2 class="font-semibold text-lg">
              {{ event.name }}
            </h2>

            <p class="text-sm text-gray-500 mt-1">
              {{ event.duration }} min • {{ event.locationType || 'Videollamada' }}
            </p>
          </div>

          <div v-if="events.length === 0" class="text-center text-gray-500">
            Este usuario no tiene reuniones disponibles.
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
  locationType?: string
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
        locationType: data.locationType,
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
