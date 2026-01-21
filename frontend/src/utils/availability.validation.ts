import type { TimeRange } from '@/stores/availability.store'

function toMinutes(time: string): number {
  const parts = time.split(':')

  if (parts.length !== 2) {
    return 0
  }

  const hours = Number(parts[0])
  const minutes = Number(parts[1])

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

export function validateRanges(ranges: TimeRange[]): string | null {
  if (ranges.length === 0) return null

  const normalized = ranges
    .map((r) => ({
      start: toMinutes(r.start),
      end: toMinutes(r.end),
    }))
    .sort((a, b) => a.start - b.start)

  for (let i = 0; i < normalized.length; i++) {
    const current = normalized[i]
    if (!current) continue

    if (current.start >= current.end) {
      return 'La hora de inicio debe ser menor que la hora de fin.'
    }

    const next = normalized[i + 1]
    if (next && current.end > next.start) {
      return 'Existen bloques de tiempo que se solapan.'
    }
  }

  return null
}
