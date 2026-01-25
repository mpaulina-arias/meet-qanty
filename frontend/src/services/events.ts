import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth.store'
import { generateEventTypeSlug as generateSlug } from '@/utils/eventSlug'
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

  const slug = generateSlug(input.name)
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
      description: input.description,
      duration: input.duration,
    }),
  )

  return {
    id: eventId,
    slug,
  }
}
