<template>
  <div class="max-w-6xl mx-auto p-6">
    <div v-if="loading" class="text-gray-500">Cargando disponibilidad...</div>

    <div v-else-if="!event || !user" class="text-red-600">Evento no encontrado</div>

    <div v-else class="grid grid-cols-3 gap-6">
      <!-- INFO EVENTO -->
      <div class="col-span-1 border rounded-lg p-4">
        <h1 class="text-xl font-bold mb-1">
          {{ user.name }}
        </h1>

        <h2 class="text-lg font-semibold">
          {{ event.name }}
        </h2>

        <p class="text-sm text-gray-600 mt-2">{{ event.duration }} min • Google Meet</p>
      </div>

      <!-- CALENDARIO + SLOTS -->
      <div class="col-span-2 flex gap-4">
        <div class="w-2/3">
          <vue-cal
            active-view="month"
            :min-date="today"
            @cell-click="onDateSelected"
            style="height: 600px"
          />
        </div>

        <div class="w-1/3 border rounded-lg p-4">
          <h3 class="font-semibold mb-2">
            {{ selectedDate ?? 'Selecciona una fecha' }}
          </h3>

          <div v-if="slotsLoading">Cargando slots...</div>

          <div v-else-if="slots.length === 0 && selectedDate">No hay horarios disponibles</div>

          <ul v-else class="space-y-2">
            <li
              v-for="slot in slots"
              :key="slot.start"
              class="border rounded p-2 text-center cursor-pointer hover:bg-blue-100"
              @click="selectSlot(slot)"
            >
              {{ slot.start }} - {{ slot.end }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/services/firebase'

/* ================= TYPES ================= */

interface Slot {
  start: string
  end: string
}

interface PublicUser {
  uid: string
  name: string
  publicSlug: string
}

interface EventType {
  name: string
  duration: number
  ownerUid: string
  slug: string
  isActive: boolean
}

/* ================= STATE ================= */

const route = useRoute()

const user = ref<PublicUser | null>(null)
const event = ref<EventType | null>(null)

const selectedDate = ref<string | null>(null)
const slots = ref<Slot[]>([])
const loading = ref(true)
const slotsLoading = ref(false)

const today = new Date().toISOString().slice(0, 10)

/* ================= LOAD ================= */

onMounted(async () => {
  loading.value = true

  try {
    console.log('Route params:', route.params)

    const userSlug = route.params.userSlug as string
    const eventSlug = route.params.eventSlug as string

    if (!userSlug || !eventSlug) {
      console.warn('Missing route params')
      return
    }

    /* =========================
       USER (por publicSlug)
    ========================= */
    const userSnap = await getDocs(
      query(collection(db, 'users'), where('publicSlug', '==', userSlug)),
    )

    if (userSnap.empty) {
      console.warn('No user found with publicSlug:', userSlug)
      return
    }

    const userDoc = userSnap.docs[0]!
    const userData = userDoc.data()

    user.value = {
      uid: userDoc.id,
      name: userData.name,
      publicSlug: userData.publicSlug,
    }

    console.log('User loaded:', user.value)

    /* =========================
       EVENT (lookup directo por ID)
       eventId = uid_slug
    ========================= */
    const eventId = `${userDoc.id}_${eventSlug}`
    const eventRef = doc(db, 'event_types', eventId)
    const eventSnap = await getDoc(eventRef)

    if (!eventSnap.exists()) {
      console.warn('Event not found:', eventId)
      return
    }

    const eventData = eventSnap.data()

    if (!eventData.isActive) {
      console.warn('Event exists but is inactive')
      return
    }

    event.value = eventData as EventType

    console.log('Event loaded:', event.value)
  } catch (err) {
    console.error('Error loading public meeting view:', err)
  } finally {
    loading.value = false
  }
})

/* ================= ACTIONS ================= */

const onDateSelected = async (date?: string) => {
  console.log('Date clicked:', date)

  if (!date) return
  if (!event.value) {
    console.warn('Event not loaded yet')
    return
  }

  const isoDate = new Date(date).toISOString().slice(0, 10)
  selectedDate.value = isoDate

  console.log('Selected ISO date:', selectedDate.value)

  slotsLoading.value = true
  slots.value = []

  try {
    const fn = httpsCallable(functions, 'getAvailableSlots')

    const payload = {
      date: selectedDate.value,
      duration: event.value.duration,
      ownerUid: event.value.ownerUid,
    }

    console.log('Calling getAvailableSlots with:', payload)

    const res = await fn(payload)

    console.log('Slots response:', res.data)

    slots.value = res.data as Slot[]
  } catch (err) {
    console.error('Error fetching slots:', err)
  } finally {
    slotsLoading.value = false
  }
}

const selectSlot = (slot: Slot) => {
  console.log('Slot selected:', slot)

  alert(`Agendar ${event.value?.name}\n${selectedDate.value} ${slot.start}`)
}
</script>
