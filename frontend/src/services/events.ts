import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'
import { generateEventTypeSlug } from '@/utils/eventSlug'
import { buildEventType } from './eventFactory'

interface CreateEventInput {
  name: string
  duration: number
  description?: string
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
  },
) {
  const ref = doc(db, 'event_types', eventId)

  await updateDoc(ref, {
    name: data.name,
    duration: data.duration,
    updatedAt: serverTimestamp(),
  })
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
