<script setup lang="ts">
import { onMounted } from 'vue'
import { useAvailabilityStore, type Day, DAYS } from '@/stores/availability.store'
import { getTimeZones } from '@/utils/timezones'

const timezones = getTimeZones()

const availability = useAvailabilityStore()

onMounted(() => {
  availability.loadSchedule()
})
</script>

<template>
  <div>
    <h1>Horario laboral</h1>

    <!-- Zona horaria -->
    <div class="timezone">
      <label>Zona horaria</label>

      <select v-model="availability.timezone">
        <option v-for="tz in timezones" :key="tz" :value="tz">
          {{ tz }}
        </option>
      </select>
    </div>

    <hr />

    <!-- Horario semanal -->
    <div v-for="day in DAYS" :key="day" class="day-row">
      <label class="day-label">
        <input type="checkbox" v-model="availability.weekly[day].enabled" />
        {{ day }}
      </label>

      <div v-if="availability.weekly[day].enabled" class="ranges">
        <div
          v-for="(range, index) in availability.weekly[day].ranges"
          :key="index"
          class="range-row"
        >
          <input type="time" v-model="range.start" />
          <span>–</span>
          <input type="time" v-model="range.end" />

          <button type="button" @click="availability.removeRange(day, index)">🗑️</button>
        </div>

        <button type="button" class="add-btn" @click="availability.addRange(day)">
          ➕ Agregar bloque
        </button>

        <p v-if="availability.errors[day]" class="error">
          {{ availability.errors[day] }}
        </p>
      </div>
    </div>

    <button class="save-btn" @click="availability.saveSchedule">Guardar cambios</button>
  </div>
</template>

<style scoped>
.timezone {
  margin-bottom: 1.5rem;
}

.day-row {
  margin-bottom: 1.2rem;
}

.day-label {
  font-weight: 600;
}

.ranges {
  margin-left: 1.5rem;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.add-btn {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.save-btn {
  margin-top: 2rem;
  padding: 0.75rem 1.25rem;
}
</style>
