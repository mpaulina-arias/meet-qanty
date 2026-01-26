import { serverTimestamp } from 'firebase/firestore'

interface BuildEventInput {
  ownerUid: string
  name: string
  slug: string
  duration: number
  description?: string
  kind: 'one_on_one' | 'group'

  location: {
    type: 'google_meet' | 'presencial' | 'custom'
    details?: string
  }

  capacity?: number // solo group
}

export function buildEventType(input: BuildEventInput) {
  return {
    ownerUid: input.ownerUid,

    name: input.name,
    slug: input.slug,
    description: input.description ?? '',
    duration: input.duration,

    kind: input.kind,

    visibility: 'public',
    isActive: true,

    location: {
      type: 'google_meet',
    },

    capacity: input.kind === 'group' ? (input.capacity ?? 10) : null,

    scheduling: {},

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}
