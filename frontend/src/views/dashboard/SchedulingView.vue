<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- HEADER SUPERIOR -->
    <div class="flex justify-between items-start mb-8">
      <div>
        <h1 class="text-2xl font-bold">Programación</h1>
        <p class="text-sm text-gray-600">Tipos de eventos</p>

        <!-- Tabs -->
        <div class="flex gap-4 mt-4 text-sm">
          <span class="font-semibold text-black border-b-2 border-black pb-1">
            Tipos de eventos
          </span>
          <span class="text-gray-500">Enlaces de un solo uso</span>
          <span class="text-gray-500">Encuestas de reuniones</span>
        </div>
      </div>

      <div class="text-right">
        <p class="text-sm font-semibold">
          {{ auth.user?.name }}
        </p>

        <a
          v-if="auth.user?.publicSlug"
          :href="`/${auth.user.publicSlug}/meetings/30min`"
          target="_blank"
          class="text-sm text-blue-600 hover:underline"
        >
          Ver página de destino
        </a>
      </div>
    </div>

    <!-- BOTÓN CREAR -->
    <div class="mb-6">
      <button class="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
        Crear
      </button>
    </div>

    <!-- LISTA DE EVENTOS -->
    <div v-if="loading" class="text-gray-500">Cargando eventos...</div>

    <div v-else-if="events.length === 0" class="text-gray-500">No tienes eventos creados.</div>

    <div v-else class="space-y-4">
      <div
        v-for="event in events"
        :key="event.id"
        class="border rounded-lg p-5 flex justify-between items-center"
      >
        <!-- INFO EVENTO -->
        <div>
          <h3 class="font-semibold text-lg">
            {{ event.name }}
          </h3>

          <p class="text-sm text-gray-600 mt-1">
            {{ event.duration }} min • Google Meet • En privado
          </p>

          <p class="text-xs text-gray-500 mt-2">Lun, Mar, Mié, Jue, Vie, Sáb, 09:00 - 17:00</p>
        </div>

        <!-- ACCIONES -->
        <div class="flex flex-col items-end gap-3">
          <button class="text-sm text-blue-600 hover:underline" @click="copyLink(event.slug)">
            Copiar enlace
          </button>

          <span class="text-xs text-gray-400">
            /{{ auth.user?.publicSlug }}/meetings/{{ event.slug }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'

interface EventType {
  id: string
  name: string
  slug: string
  duration: number
}

const auth = useAuthStore()
const loading = ref(false)
const events = ref<EventType[]>([])

onMounted(async () => {
  if (!auth.user) return

  loading.value = true

  const q = query(
    collection(db, 'event_types'),
    where('ownerUid', '==', auth.user.uid),
    where('isActive', '==', true),
  )

  const snap = await getDocs(q)

  events.value = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<EventType, 'id'>),
  }))

  loading.value = false
})

const copyLink = async (eventSlug: string) => {
  if (!auth.user?.publicSlug) return

  const url = `${window.location.origin}/${auth.user.publicSlug}/meetings/${eventSlug}`

  await navigator.clipboard.writeText(url)
  alert('Enlace copiado al portapapeles')
}
</script>
