import { timeToMinutes, minutesToTime } from './time'
import { subtractBusyFromWork } from './subtractRanges'
import { dateToMinutesInTimezone } from './time'
export function generateAvailableRanges(
  workRanges: { start: string; end: string }[],
  busyEvents: { start: string; end: string }[],
  date: string, // YYYY-MM-DD
  timezone: string,
) {
  // horario laboral → minutos
  const work = workRanges.map((r) => ({
    startMin: timeToMinutes(r.start),
    endMin: timeToMinutes(r.end),
  }))

  // límites del día LOCAL
  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59.999`)

  const busy = busyEvents
    .map((ev) => {
      const startUtc = new Date(ev.start)
      const endUtc = new Date(ev.end)

      return {
        startUtc,
        endUtc,
      }
    })
    // ✅ 1. filtrar por día LOCAL
    .filter(({ startUtc, endUtc }) => {
      const localStart = new Date(startUtc.toLocaleString('en-US', { timeZone: timezone }))
      const localEnd = new Date(endUtc.toLocaleString('en-US', { timeZone: timezone }))

      return localEnd > dayStart && localStart < dayEnd
    })
    // ✅ 2. clamp al día y convertir a minutos
    .map(({ startUtc, endUtc }) => {
      const localStart = new Date(startUtc.toLocaleString('en-US', { timeZone: timezone }))
      const localEnd = new Date(endUtc.toLocaleString('en-US', { timeZone: timezone }))

      const clampedStart = localStart < dayStart ? dayStart : localStart
      const clampedEnd = localEnd > dayEnd ? dayEnd : localEnd

      return {
        startMin: clampedStart.getHours() * 60 + clampedStart.getMinutes(),
        endMin: clampedEnd.getHours() * 60 + clampedEnd.getMinutes(),
      }
    })

  const available = subtractBusyFromWork(work, busy)

  return available.map((r) => ({
    start: minutesToTime(r.startMin),
    end: minutesToTime(r.endMin),
  }))
}
