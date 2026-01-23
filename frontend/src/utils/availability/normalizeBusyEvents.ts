// normalizeBusyEvents.ts
export function normalizeBusyEvents(events: { start: string; end: string }[], timezone: string) {
  return events.map((e) => {
    const start = new Date(e.start)
    const end = new Date(e.end)

    return {
      start: start.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
      }),
      end: end.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
      }),
    }
  })
}
