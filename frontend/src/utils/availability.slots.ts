type Interval = { start: number; end: number }

export function subtractBusySlots(available: Interval[], busy: Interval[]): Interval[] {
  let result = [...available]

  busy.forEach((b) => {
    result = result.flatMap((a) => {
      if (b.end <= a.start || b.start >= a.end) {
        return [a]
      }

      const parts: Interval[] = []

      if (b.start > a.start) {
        parts.push({ start: a.start, end: b.start })
      }

      if (b.end < a.end) {
        parts.push({ start: b.end, end: a.end })
      }

      return parts
    })
  })

  return result
}
