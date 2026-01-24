export function timeToMinutes(time: string): number {
  const parts = time.split(":")

  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time}`)
  }

  const h = Number(parts[0])
  const m = Number(parts[1])

  return h * 60 + m
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export function dateToMinutesInTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date)

  const h = Number(parts.find((p) => p.type === "hour")?.value)
  const m = Number(parts.find((p) => p.type === "minute")?.value)

  return h * 60 + m
}
