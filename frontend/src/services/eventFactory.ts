import { serverTimestamp } from 'firebase/firestore'

interface BuildEventInput {
  ownerUid: string
  name: string
  slug: string
  duration: number
  description?: string
}

export function buildEventType(input: BuildEventInput) {
  return {
    ownerUid: input.ownerUid,

    name: input.name,
    slug: input.slug,
    description: input.description ?? '',
    duration: input.duration,

    visibility: 'public',
    isActive: true,

    location: {
      type: 'google_meet',
    },

    scheduling: {},

    createdAt: serverTimestamp(),
  }
}
