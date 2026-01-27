<template>
  <div class="view-container">
    <div v-if="loading" class="muted">Cargando disponibilidad...</div>

    <div v-else-if="!event || !user" class="error">Evento no encontrado</div>

    <div v-else class="booking-layout">
      <div class="booking-grid">
        <!-- INFO EVENTO -->
        <div class="booking-info">
          <h1 class="section-title">{{ user.name }}</h1>

          <h2 class="event-title">{{ event.name }}</h2>

          <p class="muted mt-2">{{ event.duration }} min</p>

          <div class="location-type">
            <i class="bi bi-camera-video" v-if="event.location.type === 'google_meet'" />
            <i class="bi bi-geo-alt" v-else-if="event.location.type === 'in_person'" />
            <i class="bi bi-link-45deg" v-else />

            <span>
              {{
                event.location.type === 'google_meet'
                  ? 'Google Meet'
                  : event.location.type === 'in_person'
                    ? 'Presencial'
                    : 'Enlace externo'
              }}
            </span>
          </div>
        </div>

        <!-- CALENDARIO -->
        <div class="booking-calendar">
          <h3 class="calendar-title">Selecciona una fecha</h3>

          <vue-cal
            locale="es"
            active-view="month"
            :min-date="today"
            :time="false"
            :disable-views="['years', 'year', 'week', 'day']"
            @cell-click="onDateSelected"
            style="height: 480px"
          />
        </div>

        <!-- SLOTS -->
        <div class="booking-slots">
          <h3 class="calendar-title">
            {{ selectedDate ?? 'Horarios disponibles' }}
          </h3>

          <div v-if="slotsLoading" class="muted">Cargando slots...</div>

          <div v-else-if="slots.length === 0 && selectedDate" class="muted">
            No hay horarios disponibles
          </div>

          <ul v-else class="slots-list">
            <li v-for="slot in slots" :key="slot.start" class="slot-item" @click="selectSlot(slot)">
              {{ slot.start }}
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
  location: {
    type: string
  }
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

    // event.value = {
    //   ...(eventData as EventType),
    //   ownerUid: userDoc.id, //  asegurar que siempre exista
    // }

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
