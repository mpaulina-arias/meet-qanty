export interface TimeRange {
  startMin: number
  endMin: number
}

export function subtractBusyFromWork(
  workRanges: TimeRange[],
  busyRanges: TimeRange[],
): TimeRange[] {
  let result: TimeRange[] = [...workRanges]

  for (const busy of busyRanges) {
    result = result.flatMap((work) => {
      // no overlap
      if (busy.endMin <= work.startMin || busy.startMin >= work.endMin) {
        return [work]
      }

      const ranges: TimeRange[] = []

      if (busy.startMin > work.startMin) {
        ranges.push({
          startMin: work.startMin,
          endMin: busy.startMin,
        })
      }

      if (busy.endMin < work.endMin) {
        ranges.push({
          startMin: busy.endMin,
          endMin: work.endMin,
        })
      }

      return ranges
    })
  }

  return result
}
