<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAvailabilityStore, DAYS, type Day } from '@/stores/availability.store'
import { getTimeZones } from '@/utils/timezones'
import { httpsCallable } from 'firebase/functions'
import { functions, db } from '@/services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.store'

/* =======================
   TYPES
======================= */
type Slot = {
  start: string
  end: string
}

/* =======================
   STORES & STATE
======================= */
const availability = useAvailabilityStore()
const auth = useAuthStore()
const timezones = getTimeZones()

const googleConnected = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const availableSlots = ref<Slot[]>([])

/* =======================
   GOOGLE CALENDAR
======================= */
const checkGoogleConnection = async () => {
  if (!auth.user) return

  const refDoc = doc(db, 'calendar_integrations', auth.user.uid)
  const snap = await getDoc(refDoc)

  googleConnected.value = snap.exists()
}

const connectGoogleCalendar = () => {
  if (!auth.user) return

  const isLocalhost = window.location.hostname === 'localhost'
  const env = isLocalhost ? 'dev' : 'prod'

  window.location.href =
    'https://us-central1-meet-qanty.cloudfunctions.net/oauthGoogleStart' +
    `?uid=${auth.user.uid}&env=${env}`
}

const testAvailableSlots = async () => {
  if (!googleConnected.value) return

  loading.value = true
  error.value = null

  try {
    const fnSlots = httpsCallable(functions, 'getAvailableSlots')
    const fnBusy = httpsCallable(functions, 'getBusyEvents')

    const dateStr = '2026-01-27'
    const duration = 30

    const slotsRes = await fnSlots({ date: dateStr, duration })
    availableSlots.value = slotsRes.data as Slot[]

    const start = `${dateStr}T00:00:00Z`
    const end = `${dateStr}T23:59:59.999Z`
    const busyRes = await fnBusy({ start, end })

    console.log('BUSY EVENTS:', busyRes.data)
  } catch (err: any) {
    console.error(err)
    error.value = err.message ?? 'Error obteniendo disponibilidad'
  } finally {
    loading.value = false
  }
}

/* =======================
   AUTH-DEPENDENT LOAD
======================= */
watch(
  () => auth.user,
  async (user) => {
    if (!user) return

    await availability.loadSchedule()
    await checkGoogleConnection()
  },
  { immediate: true },
)

/* =======================
   HELPERS
======================= */
function formatDay(day: Day): string {
  return day.charAt(0).toUpperCase() + day.slice(1)
}
</script>

<template>
  <div class="availability-view">
    <h1>Horario laboral</h1>

    <!-- =======================
         Google Calendar
    ======================= -->
    <section class="integration">
      <h2>Google Calendar</h2>

      <p v-if="googleConnected" class="ok">✅ Conectado correctamente</p>

      <button v-else class="connect-btn" @click="connectGoogleCalendar">
        🔗 Conectar Google Calendar
      </button>
    </section>

    <hr />

    <!-- =======================
         Zona horaria
    ======================= -->
    <div class="timezone">
      <label for="timezone">Zona horaria</label>

      <select id="timezone" v-model="availability.timezone">
        <option v-for="tz in timezones" :key="tz" :value="tz">
          {{ tz }}
        </option>
      </select>
    </div>

    <hr />

    <!-- =======================
         Horario semanal
    ======================= -->
    <div v-for="day in DAYS" :key="day" class="day-row">
      <label class="day-label">
        <input type="checkbox" v-model="availability.weekly[day].enabled" />
        {{ formatDay(day) }}
      </label>

      <div v-if="availability.weekly[day].enabled" class="ranges">
        <div
          v-for="(range, index) in availability.weekly[day].ranges"
          :key="index"
          class="range-row"
        >
          <input type="time" v-model="range.start" @change="availability.validateDay(day)" />

          <span>–</span>

          <input type="time" v-model="range.end" @change="availability.validateDay(day)" />

          <button type="button" class="delete-btn" @click="availability.removeRange(day, index)">
            🗑️
          </button>
        </div>

        <button type="button" class="add-btn" @click="availability.addRange(day)">
          ➕ Agregar bloque
        </button>

        <p v-if="availability.errors[day]" class="error">
          {{ availability.errors[day] }}
        </p>
      </div>
    </div>

    <!-- =======================
         ACCIONES
    ======================= -->
    <button class="save-btn" @click="availability.saveSchedule">Guardar cambios</button>

    <button v-if="googleConnected" @click="testAvailableSlots" :disabled="loading">
      {{ loading ? 'Consultando…' : 'Probar disponibilidad' }}
    </button>

    <p v-if="error" class="error">
      {{ error }}
    </p>

    <!-- DEBUG -->
    <pre v-if="availableSlots.length"
      >{{ availableSlots }}
    </pre>
  </div>
</template>
