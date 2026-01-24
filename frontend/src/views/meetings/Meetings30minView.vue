<template>
  <div class="flex gap-4">
    <!-- Calendario -->
    <div class="w-2/3">
      <vue-cal
        v-model:selected-date="selectedDate"
        @cell-click="onDateSelected"
        :events="bookedEvents"
        active-view="month"
        :min-date="today"
        :time-from="0"
        :time-to="24"
        style="height: 600px"
      />
    </div>

    <!-- Panel de slots -->
    <div class="w-1/3 p-4 border rounded shadow">
      <h3 class="text-lg font-bold mb-2">Slots disponibles</h3>

      <div v-if="!selectedDate">Selecciona una fecha en el calendario</div>

      <div v-else>
        <div v-if="loading">Cargando slots...</div>
        <div v-else-if="slots.length === 0">No hay slots disponibles</div>
        <ul v-else class="space-y-1">
          <li
            v-for="slot in slots"
            :key="slot.start"
            class="p-2 border rounded cursor-pointer hover:bg-blue-100"
            @click="selectSlot(slot)"
          >
            {{ slot.start }} - {{ slot.end }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

interface Slot {
  start: string
  end: string
}

const selectedDate = ref<string | null>(null)
const slots = ref<Slot[]>([])
const bookedEvents = ref<any[]>([]) // Podría mapear busy events para q aparezcan en el calendario
const loading = ref(false)

const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

// Al seleccionar un día
const onDateSelected = async (date: string | undefined) => {
  // Si date es undefined, no hace nada
  if (!date) {
    selectedDate.value = null
    slots.value = []
    return
  }

  // Convertir a YYYY-MM-DD
  const isoDate = new Date(date).toISOString().split('T')[0] || null

  selectedDate.value = isoDate
  slots.value = []
  loading.value = true

  try {
    const fn = httpsCallable(functions, 'getAvailableSlots')
    const res = await fn({ date: isoDate, duration: 30 })
    slots.value = res.data as Slot[]
    console.log('AVAILABLE SLOTS:', slots.value)
  } catch (err: any) {
    console.error(err)
    slots.value = []
  } finally {
    loading.value = false
  }
}

// Acción al seleccionar un slot
const selectSlot = (slot: Slot) => {
  alert(`Seleccionaste ${slot.start} - ${slot.end} el día ${selectedDate.value}`)
}
</script>

<style scoped>
/* Opcional: estilo de scrollbar en panel de slots */
div::-webkit-scrollbar {
  width: 8px;
}
div::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>
