import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'
import { generateEventTypeSlug } from '@/utils/eventSlug'
import { buildEventType } from './eventFactory'

interface CreateEventInput {
  name: string
  duration: number
  description?: string

  kind: 'one_on_one' | 'group'

  location: {
    type: 'google_meet' | 'presencial' | 'custom'
    details?: string
  }

  capacity?: number // solo group
}

export async function createEvent(input: CreateEventInput) {
  const auth = useAuthStore()

  if (!auth.user) {
    throw new Error('User not authenticated')
  }

  const slug = generateEventTypeSlug(input.name)
  const eventId = `${auth.user.uid}_${slug}`

  const ref = doc(db, 'event_types', eventId)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    throw new Error('Ya existe un evento con ese enlace')
  }

  await setDoc(
    ref,
    buildEventType({
      ownerUid: auth.user.uid,
      name: input.name,
      slug,
      duration: input.duration,
      description: input.description,
      kind: input.kind,
      location: input.location?.details
        ? { type: input.location.type, details: input.location.details }
        : { type: input.location.type },
      capacity: input.capacity,
    }),
  )

  return {
    id: eventId,
    slug,
  }
}

/* =========================
   UPDATE EVENT
========================= */
export async function updateEvent(
  eventId: string,
  data: {
    name: string
    duration: number
    location: {
      type: 'google_meet' | 'presencial' | 'custom'
      details?: string
    }
    kind: 'one_on_one' | 'group'
    capacity?: number
  },
) {
  const ref = doc(db, 'event_types', eventId)

  const location: any = {
    type: data.location.type,
  }

  //Solo agregar details si realmente existe
  if (data.location.details && data.location.details.trim() !== '') {
    location.details = data.location.details
  }

  const updatePayload: any = {
    name: data.name,
    duration: data.duration,
    location,
    kind: data.kind,
    updatedAt: serverTimestamp(),
  }

  // Solo guardar capacity si es evento grupal
  if (data.kind === 'group' && data.capacity) {
    updatePayload.capacity = data.capacity
  }

  await updateDoc(ref, updatePayload)
}

/* =========================
   SOFT DELETE EVENT
========================= */
export async function deactivateEvent(eventId: string) {
  const ref = doc(db, 'event_types', eventId)

  await updateDoc(ref, {
    isActive: false,
    deactivatedAt: serverTimestamp(),
  })
}
