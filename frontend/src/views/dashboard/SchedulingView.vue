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
          :href="`/${auth.user.publicSlug}/meetings`"
          target="_blank"
          class="text-sm text-blue-600 hover:underline"
        >
          Ver página de destino
        </a>
      </div>
    </div>

    <!-- BOTÓN CREAR -->
    <div class="mb-6">
      <button
        class="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        @click="showCreateModal = true"
      >
        Crear
      </button>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg w-full max-w-md p-6">
        <h2 class="text-lg font-semibold mb-4">Nuevo tipo de evento</h2>

        <!-- Nombre -->
        <div class="mb-4">
          <label class="block text-sm mb-1">Nombre</label>
          <input
            v-model="form.name"
            class="border rounded w-full px-3 py-2"
            placeholder="Ej: 45 Minute Meeting"
          />
        </div>

        <!-- Duración -->
        <div class="mb-4">
          <label class="block text-sm mb-1">Duración</label>
          <div class="flex gap-2">
            <input
              type="number"
              min="1"
              v-model.number="form.durationValue"
              class="border rounded px-3 py-2 w-24"
            />

            <select v-model="form.durationUnit" class="border rounded px-3 py-2">
              <option value="min">minutos</option>
              <option value="hour">horas</option>
            </select>
          </div>

          <p class="text-xs text-gray-500 mt-1">Total: {{ durationInMinutes }} minutos</p>
        </div>

        <!-- Preview link -->
        <div v-if="previewLink" class="mb-4 text-sm">
          <p class="text-gray-500">Enlace público</p>
          <p class="text-blue-600 break-all">
            {{ previewLink }}
          </p>
        </div>

        <!-- Acciones -->
        <div class="flex justify-end gap-3">
          <button class="text-sm text-gray-600" @click="showCreateModal = false">Cancelar</button>

          <button
            class="bg-blue-600 text-white px-4 py-2 rounded"
            :disabled="creating"
            @click="handleCreate"
          >
            Crear evento
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg w-full max-w-md p-6">
        <h2 class="text-lg font-semibold mb-4">Editar evento</h2>

        <div class="mb-4">
          <label class="block text-sm mb-1">Nombre</label>
          <input v-model="editForm.name" class="border rounded w-full px-3 py-2" />
        </div>

        <div class="mb-4">
          <label class="block text-sm mb-1">Duración</label>
          <input
            type="number"
            min="1"
            v-model.number="editForm.duration"
            class="border rounded w-full px-3 py-2"
          />
          <p class="text-xs text-gray-500 mt-1">Minutos</p>
        </div>

        <div class="flex justify-end gap-3">
          <button class="text-sm text-gray-600" @click="showEditModal = false">Cancelar</button>

          <button
            class="bg-blue-600 text-white px-4 py-2 rounded"
            :disabled="editing"
            @click="handleUpdate"
          >
            Guardar cambios
          </button>
        </div>
      </div>
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
            {{ event.duration }} min - {{ event.location.type }}
          </p>
        </div>

        <!-- ACCIONES -->
        <div class="flex flex-col items-end gap-2">
          <button class="text-sm text-blue-600 hover:underline" @click="copyLink(event.slug)">
            Copiar enlace
          </button>

          <button class="text-sm text-gray-600 hover:underline" @click="openEdit(event)">
            Editar
          </button>

          <button class="text-sm text-red-600 hover:underline" @click="removeEvent(event)">
            Eliminar
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
import { ref, computed, watch } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'
import { createEvent } from '@/services/events'
import { generateEventTypeSlug } from '@/utils/eventSlug'
import { updateEvent, deactivateEvent } from '@/services/events'

interface EventType {
  id: string
  name: string
  slug: string
  duration: number
  location: {
    type: string
    details?: string
  }
}

const auth = useAuthStore()

const loading = ref(false)
const creating = ref(false)
const events = ref<EventType[]>([])

const showCreateModal = ref(false)

const form = ref({
  name: '',
  durationValue: 30,
  durationUnit: 'min' as 'min' | 'hour',
})

/* =========================
   DURACIÓN
========================= */
const durationInMinutes = computed(() => {
  return form.value.durationUnit === 'hour'
    ? form.value.durationValue * 60
    : form.value.durationValue
})

/* =========================
   PREVIEW LINK
========================= */
const previewSlug = computed(() => {
  if (!form.value.name) return ''
  return generateEventTypeSlug(form.value.name)
})

const previewLink = computed(() => {
  if (!auth.user?.publicSlug || !previewSlug.value) return ''
  return `/${auth.user.publicSlug}/meetings/${previewSlug.value}`
})

/* =========================
   LOAD EVENTS
========================= */
const loadEvents = async () => {
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
}

/* ✅ CLAVE: esperar a que auth.user exista */
watch(
  () => auth.user,
  (user) => {
    if (user) {
      loadEvents()
    }
  },
  { immediate: true },
)

/* =========================
   CREATE EVENT
========================= */
const handleCreate = async () => {
  if (!form.value.name) {
    alert('Ingresa un nombre')
    return
  }

  try {
    creating.value = true

    await createEvent({
      name: form.value.name,
      duration: durationInMinutes.value,
    })

    showCreateModal.value = false

    form.value = {
      name: '',
      durationValue: 30,
      durationUnit: 'min',
    }

    await loadEvents()
  } catch (err: any) {
    alert(err.message)
  } finally {
    creating.value = false
  }
}

/* =========================
   COPY LINK
========================= */
const copyLink = async (eventSlug: string) => {
  if (!auth.user?.publicSlug) return

  const url = `${window.location.origin}/${auth.user.publicSlug}/meetings/${eventSlug}`
  await navigator.clipboard.writeText(url)

  alert('Enlace copiado al portapapeles')
}

const showEditModal = ref(false)
const editing = ref(false)

const editForm = ref({
  id: '',
  name: '',
  duration: 30,
})

const openEdit = (event: EventType) => {
  editForm.value = {
    id: event.id,
    name: event.name,
    duration: event.duration,
  }

  showEditModal.value = true
}

const handleUpdate = async () => {
  if (!editForm.value.name) {
    alert('Ingresa un nombre')
    return
  }

  if (!editForm.value.duration) {
    alert('Ingresa una duración')
    return
  }

  try {
    editing.value = true

    await updateEvent(editForm.value.id, {
      name: editForm.value.name,
      duration: editForm.value.duration,
    })

    showEditModal.value = false

    await loadEvents()
  } catch (err: any) {
    alert(err.message)
  } finally {
    editing.value = false
  }
}

const removeEvent = async (event: EventType) => {
  const confirmed = confirm(
    `¿Está seguro que desea eliminar este evento?\n\n` +
      `Los usuarios no podrán programar más reuniones con los tipos de eventos eliminados. ` +
      `Las reuniones programadas con anterioridad no se verán afectadas.`,
  )
  if (!confirmed) return

  try {
    await deactivateEvent(event.id)
    await loadEvents()
  } catch (err: any) {
    alert(err.message)
  }
}
</script>
