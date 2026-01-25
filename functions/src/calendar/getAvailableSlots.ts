import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../utils/firestore";
import { getValidGoogleAccessToken } from "./refreshGoogleToken";
import { generateAvailableRanges } from "../availability/generateAvailableRanges";
import { minutesToTime } from "../availability/time";

/* =========================
   HELPERS
========================= */

function getWeekdayInTimezone(date: string, timezone: string): string {
  const [y, m, d] = date.split("-").map(Number);

  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // mediodía UTC

  return utcDate
    .toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: timezone,
    })
    .toLowerCase();
}

function dayRangeInTimezone(date: string, timezone: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

function rfc3339ToLocalMinutes(dateStr: string, timezone: string): number {
  const d = new Date(dateStr);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).formatToParts(d);

  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/* =========================
   FUNCTION
========================= */

export const getAvailableSlots = onCall(
  {
    region: "us-central1",
    secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  async (request) => {
    const { date, duration = 30, ownerUid } = request.data ?? {};

    if (!date || typeof date !== "string") {
      throw new HttpsError("invalid-argument", "date is required");
    }

    // 🔑 Resolver UID (privado o público)
    const uid =
      request.auth?.uid ?? (typeof ownerUid === "string" ? ownerUid : null);

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "ownerUid required for public access",
      );
    }

    /* =========================
       USER
    ========================= */

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const { timezone } = userSnap.data()!;
    if (!timezone) {
      throw new HttpsError("failed-precondition", "Timezone missing");
    }

    /* =========================
       WORK SCHEDULE
    ========================= */

    const scheduleSnap = await db.collection("work_schedules").doc(uid).get();

    if (!scheduleSnap.exists) {
      return []; // sin horario → sin slots
    }

    const schedule = scheduleSnap.data()!;
    const day = getWeekdayInTimezone(date, timezone);

    const daySchedule = schedule.weekly?.[day];
    if (!daySchedule?.enabled) {
      return [];
    }

    /* =========================
       GOOGLE CALENDAR
    ========================= */

    const accessToken = await getValidGoogleAccessToken(uid);
    const { timeMin, timeMax } = dayRangeInTimezone(date, timezone);

    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: "primary" }],
      }),
    });

    if (!res.ok) {
      throw new HttpsError("internal", "Google Calendar error");
    }

    const data = await res.json();
    const busyRaw = data?.calendars?.primary?.busy ?? [];

    const busyRanges = busyRaw.map((b: { start: string; end: string }) => ({
      startMin: rfc3339ToLocalMinutes(b.start, timezone),
      endMin: rfc3339ToLocalMinutes(b.end, timezone),
    }));

    /* =========================
       AVAILABILITY
    ========================= */

    const availableRanges = generateAvailableRanges(
      daySchedule.ranges,
      busyRanges,
    );

    const slots: { start: string; end: string }[] = [];

    for (const range of availableRanges) {
      let current = range.startMin;

      while (current + duration <= range.endMin) {
        slots.push({
          start: minutesToTime(current),
          end: minutesToTime(current + duration),
        });
        current += duration;
      }
    }

    return slots;
  },
);
