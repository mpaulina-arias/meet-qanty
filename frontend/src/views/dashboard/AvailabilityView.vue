<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAvailabilityStore, DAYS, type Day } from '@/stores/availability.store'
import { getTimeZones } from '@/utils/timezones'
import { httpsCallable } from 'firebase/functions'
import { functions, db } from '@/services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth.store'
import { generateAvailableRanges } from '@/utils/availability/generateAvailableRanges'

type BusyEvent = {
  start: string
  end: string
}

/* =======================
   STORES & STATE
======================= */
const busyEvents = ref<BusyEvent[]>([])
const availableSlots = ref<any[]>([])

const availability = useAvailabilityStore()
const auth = useAuthStore()
const timezones = getTimeZones()

const googleConnected = ref(false)
const loadingBusy = ref(false)
const error = ref<string | null>(null)

/* =======================
   GOOGLE CALENDAR
======================= */

/**
 * Verifica si el usuario ya conectó Google Calendar
 */
const checkGoogleConnection = async () => {
  if (!auth.user) return

  const refDoc = doc(db, 'calendar_integrations', auth.user.uid)
  const snap = await getDoc(refDoc)

  googleConnected.value = snap.exists()
}

/**
 * Inicia OAuth (DEV o PROD)
 */
const connectGoogleCalendar = () => {
  if (!auth.user) return

  const isLocalhost = window.location.hostname === 'localhost'

  const env = isLocalhost ? 'dev' : 'prod'

  window.location.href =
    'https://us-central1-meet-qanty.cloudfunctions.net/oauthGoogleStart' +
    `?uid=${auth.user.uid}&env=${env}`
}

/**
 * Prueba eventos ocupados (solo si está conectado)
 */
const testBusyEvents = async () => {
  if (!googleConnected.value) return

  loadingBusy.value = true
  error.value = null

  try {
    const fn = httpsCallable(functions, 'getBusyEvents')

    const start = new Date().toISOString()
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const res = await fn({ start, end })

    busyEvents.value = res.data as BusyEvent[]

    console.log('Busy events:', busyEvents.value)

    // 🧠 EJEMPLO: martes 2026-01-27
    availableSlots.value = generateAvailableRanges(
      availability.weekly.tuesday.ranges,
      busyEvents.value,
      '2026-01-27',
      availability.timezone,
    )

    console.log('AVAILABLE:', availableSlots.value)
  } catch (err: any) {
    console.error(err)
    error.value = err.message ?? 'Error consultando Google Calendar'
  } finally {
    loadingBusy.value = false
  }
}

/* =======================
   LIFECYCLE
======================= */
onMounted(() => {
  availability.loadSchedule()
})

watch(
  () => auth.user,
  async (user) => {
    if (user) {
      await checkGoogleConnection()
    }
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

    <button v-if="googleConnected" @click="testBusyEvents" :disabled="loadingBusy">
      {{ loadingBusy ? 'Consultando…' : 'Probar eventos ocupados' }}
    </button>

    <p v-if="error" class="error">
      {{ error }}
    </p>
  </div>
</template>
