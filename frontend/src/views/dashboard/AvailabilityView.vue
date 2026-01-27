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

const activeTab = ref<'hours' | 'calendar' | 'advanced'>('hours')

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
  <div class="view-container">
    <!-- HEADER -->
    <div class="view-header">
      <!-- <h1>Disponibilidad</h1> -->
      <p class="subtitle">Define cuándo pueden agendar reuniones contigo</p>
    </div>

    <!-- TABS -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'hours' }" @click="activeTab = 'hours'">
        Horarios
      </button>

      <button
        class="tab"
        :class="{ active: activeTab === 'calendar' }"
        @click="activeTab = 'calendar'"
      >
        Configuración de calendario
      </button>

      <button
        class="tab"
        :class="{ active: activeTab === 'advanced' }"
        @click="activeTab = 'advanced'"
      >
        Configuración avanzada
      </button>
    </div>

    <!-- ================= TAB: HORARIOS ================= -->
    <div v-show="activeTab === 'hours'">
      <section class="card">
        <div class="card-header row-between">
          <div>
            <h2>Horas semanales</h2>
            <p class="muted">Establece cuándo estás disponible habitualmente</p>
          </div>
        </div>

        <div class="card-body">
          <div v-for="day in DAYS" :key="day" class="weekly-row">
            <div class="day-card">
              <div class="day-header">
                <div class="day-left">
                  <input type="checkbox" v-model="availability.weekly[day].enabled" />
                  <span class="day-name">{{ formatDay(day) }}</span>
                </div>

                <span
                  class="status-badge"
                  :class="{
                    on: availability.weekly[day].enabled,
                    off: !availability.weekly[day].enabled,
                  }"
                >
                  {{ availability.weekly[day].enabled ? 'Disponible' : 'No disponible' }}
                </span>
              </div>

              <div v-if="availability.weekly[day].enabled" class="ranges">
                <div
                  v-for="(range, index) in availability.weekly[day].ranges"
                  :key="index"
                  class="range-row"
                >
                  <div class="time-group">
                    <input
                      type="time"
                      v-model="range.start"
                      @change="availability.validateDay(day)"
                    />
                    <span class="dash">–</span>
                    <input
                      type="time"
                      v-model="range.end"
                      @change="availability.validateDay(day)"
                    />
                  </div>

                  <button class="icon-btn danger" @click="availability.removeRange(day, index)">
                    ✕
                  </button>
                </div>

                <button class="link-btn" @click="availability.addRange(day)">
                  + Agregar horas
                </button>

                <p v-if="availability.errors[day]" class="error">
                  {{ availability.errors[day] }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ================= TAB: CALENDARIO ================= -->
    <div v-show="activeTab === 'calendar'">
      <div class="card-header">
        <h2>Integración de calendario</h2>
      </div>

      <div class="card-body">
        <h3>Google Calendar</h3>

        <p v-if="googleConnected" class="ok">✅ Conectado correctamente</p>

        <button v-else class="primary-btn" @click="connectGoogleCalendar">
          Conectar Google Calendar
        </button>
      </div>
    </div>

    <!-- ================= TAB: AVANZADO ================= -->
    <div v-show="activeTab === 'advanced'">
      <!-- ZONA HORARIA (RESTAURADA) -->
      <section class="card">
        <div class="card-header">
          <h2>Zona horaria</h2>
        </div>

        <div class="card-body">
          <label class="label">Zona horaria</label>
          <select v-model="availability.timezone" class="select">
            <option v-for="tz in timezones" :key="tz" :value="tz">
              {{ tz }}
            </option>
          </select>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Configuración avanzada</h2>
        </div>

        <div class="card-body muted">
          Próximamente: buffers, límites diarios, antelación mínima, etc.
        </div>
      </section>
    </div>

    <!-- ACCIONES GLOBALES (SIGUEN IGUAL) -->
    <div class="actions-bar">
      <button class="primary-btn" @click="availability.saveSchedule">Guardar cambios</button>

      <button
        v-if="googleConnected"
        class="secondary-btn"
        @click="testAvailableSlots"
        :disabled="loading"
      >
        {{ loading ? 'Consultando…' : 'Probar disponibilidad' }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <pre v-if="availableSlots.length" class="debug-box">{{ availableSlots }}</pre>
  </div>
</template>
