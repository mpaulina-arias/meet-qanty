<template>
  <div class="view-container">
    <!-- HEADER SUPERIOR -->
    <div class="view-header">
      <div>
        <p class="subtitle">Tipos de eventos</p>
      </div>

      <div class="text-right">
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

    <!-- ACCIÓN PRINCIPAL -->
    <section class="card">
      <div class="card-body row-between">
        <div>
          <h2>Tipos de eventos</h2>
          <p class="muted">Crea y administra tus eventos disponibles</p>
        </div>

        <button class="primary-btn" @click="showCreateModal = true">Crear</button>
      </div>
    </section>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg w-full max-w-md p-6">
        <h2 class="text-lg font-semibold mb-4">Nuevo tipo de evento</h2>

        <!-- Tipo de reunión -->
        <div class="mb-4">
          <label class="block text-sm mb-2 font-semibold">Tipo de reunión</label>

          <div class="flex gap-3">
            <button
              type="button"
              class="border rounded px-3 py-2 text-sm"
              :class="form.kind === 'one_on_one' ? 'border-black font-semibold' : 'text-gray-500'"
              @click="form.kind = 'one_on_one'"
            >
              1 a 1
            </button>

            <button
              type="button"
              class="border rounded px-3 py-2 text-sm"
              :class="form.kind === 'group' ? 'border-black font-semibold' : 'text-gray-500'"
              @click="form.kind = 'group'"
            >
              Grupo
            </button>
          </div>
        </div>

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

        <!-- Ubicación -->
        <div class="mb-4">
          <label class="block text-sm mb-1">Ubicación</label>

          <select v-model="form.locationType" class="border rounded w-full px-3 py-2">
            <option value="google_meet">Google Meet</option>
            <option value="presencial">Presencial</option>
            <option value="custom">Personalizada</option>
          </select>

          <input
            v-if="form.locationType === 'custom'"
            v-model="form.locationDetails"
            class="select mt-2"
            placeholder="Ej: Oficina 402 o enlace externo"
          />
        </div>

        <!-- Capacidad -->
        <div v-if="form.kind === 'group'" class="mb-4">
          <label class="block text-sm mb-1">Límite de invitados</label>
          <input type="number" min="2" v-model.number="form.capacity" class="select" />
        </div>

        <!-- Preview link -->
        <div v-if="previewLink" class="mb-4 text-sm">
          <p class="muted">Enlace público</p>
          <p class="text-blue-600 break-all">
            {{ previewLink }}
          </p>
        </div>

        <!-- Acciones -->
        <div class="actions-bar">
          <button class="secondary-btn" @click="showCreateModal = false">Cancelar</button>

          <button class="primary-btn" :disabled="creating" @click="handleCreate">
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

        <!-- Tipo -->
        <div class="mb-4">
          <label class="block text-sm mb-2 font-semibold">Tipo de reunión</label>

          <div class="flex gap-3">
            <button
              type="button"
              class="border rounded px-3 py-2 text-sm"
              :class="
                editForm.kind === 'one_on_one' ? 'border-black font-semibold' : 'text-gray-500'
              "
              @click="editForm.kind = 'one_on_one'"
            >
              1 a 1
            </button>

            <button
              type="button"
              class="border rounded px-3 py-2 text-sm"
              :class="editForm.kind === 'group' ? 'border-black font-semibold' : 'text-gray-500'"
              @click="editForm.kind = 'group'"
            >
              Grupo
            </button>
          </div>
        </div>

        <!-- Nombre -->
        <div class="mb-4">
          <label class="block text-sm mb-1">Nombre</label>
          <input v-model="editForm.name" class="border rounded w-full px-3 py-2" />
        </div>

        <!-- Duración -->
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

        <!-- Ubicación -->
        <div class="mb-4">
          <label class="block text-sm mb-1">Ubicación</label>

          <select v-model="editForm.locationType" class="border rounded w-full px-3 py-2">
            <option value="google_meet">Google Meet</option>
            <option value="presencial">Presencial</option>
            <option value="custom">Personalizada</option>
          </select>

          <input
            v-if="editForm.locationType === 'custom'"
            v-model="editForm.locationDetails"
            class="border rounded w-full px-3 py-2 mt-2"
            placeholder="Ej: Oficina 402 o enlace externo"
          />
        </div>

        <!-- Capacidad -->
        <div v-if="editForm.kind === 'group'" class="mb-4">
          <label class="block text-sm mb-1">Límite de invitados</label>
          <input
            type="number"
            min="2"
            v-model.number="editForm.capacity"
            class="border rounded w-full px-3 py-2"
          />
        </div>

        <!-- ACCIONES EDITAR -->
        <div class="flex justify-end gap-3 mt-6">
          <button class="text-sm text-gray-600" @click="showEditModal = false" :disabled="editing">
            Cancelar
          </button>

          <button
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            :disabled="editing"
            @click="handleUpdate"
          >
            <span v-if="editing">Guardando...</span>
            <span v-else>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>

    <!-- LISTA DE EVENTOS -->
    <section class="card">
      <div class="card-header">
        <h2>Tus eventos</h2>
      </div>

      <div class="card-body">
        <div v-if="loading" class="muted">Cargando eventos...</div>

        <div v-else-if="events.length === 0" class="muted">No tienes eventos creados.</div>

        <div v-else class="space-y-4">
          <div
            v-for="event in events"
            :key="event.id"
            class="border rounded-lg p-5 flex justify-between items-center"
          >
            <div>
              <h3 class="font-semibold text-lg">
                {{ event.name }}
              </h3>

              <p class="text-sm text-gray-600 mt-1">
                {{ event.duration }} min - {{ event.location.type }} - {{ event.kind }}
              </p>
            </div>

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
    </section>
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

  kind?: 'one_on_one' | 'group'
  capacity?: number

  location: {
    type: 'google_meet' | 'presencial' | 'custom'
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

  kind: 'one_on_one' as 'one_on_one' | 'group',

  durationValue: 30,
  durationUnit: 'min' as 'min' | 'hour',

  locationType: 'google_meet' as 'google_meet' | 'presencial' | 'custom',
  locationDetails: '',

  capacity: 10, // solo para group
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

function isValidLocationType(value: any): value is 'google_meet' | 'presencial' | 'custom' {
  return ['google_meet', 'presencial', 'custom'].includes(value)
}

/* Esperar a que auth.user exista */
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

      kind: form.value.kind,

      location: {
        type: form.value.locationType,
        details: form.value.locationType === 'custom' ? form.value.locationDetails : undefined,
      },
      capacity: form.value.kind === 'group' ? form.value.capacity : undefined,
    })

    showCreateModal.value = false

    form.value = {
      name: '',
      durationValue: 30,
      durationUnit: 'min',
      kind: 'one_on_one',
      locationType: 'google_meet',
      locationDetails: '',
      capacity: 10,
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

  kind: 'one_on_one' as 'one_on_one' | 'group',

  locationType: 'google_meet' as 'google_meet' | 'presencial' | 'custom',
  locationDetails: '',

  capacity: 10,
})

const openEdit = (event: EventType) => {
  const locationType = isValidLocationType(event.location?.type)
    ? event.location.type
    : 'google_meet'

  editForm.value = {
    id: event.id,
    name: event.name,
    duration: event.duration,

    kind: event.kind ?? 'one_on_one',

    locationType,
    locationDetails: event.location?.details ?? '',

    capacity: event.capacity ?? 10,
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

      kind: editForm.value.kind,

      location: {
        type: editForm.value.locationType,
        details:
          editForm.value.locationType === 'custom' ? editForm.value.locationDetails : undefined,
      },

      capacity: editForm.value.kind === 'group' ? editForm.value.capacity : undefined,
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
