// functions/src/availability/generateAvailableRanges.ts
import { timeToMinutes } from "./time";
import { subtractBusyFromWork } from "./subtractRanges";

export interface MinuteRange {
  startMin: number;
  endMin: number;
}

export function generateAvailableRanges(
  workRanges: { start: string; end: string }[],
  busyRanges: MinuteRange[],
): MinuteRange[] {
  const work = workRanges.map((r) => ({
    startMin: timeToMinutes(r.start),
    endMin: timeToMinutes(r.end),
  }));

  return subtractBusyFromWork(work, busyRanges);
}
