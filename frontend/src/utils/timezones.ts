export function getTimeZones(): string[] {
  if ('supportedValuesOf' in Intl) {
    // @ts-ignore
    return Intl.supportedValuesOf('timeZone')
  }

  // Fallback mínimo
  return ['UTC', 'America/Bogota', 'America/New_York', 'Europe/Madrid']
}
