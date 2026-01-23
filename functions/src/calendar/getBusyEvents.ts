import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getValidGoogleAccessToken } from "./refreshGoogleToken";

const GOOGLE_CLIENT_ID = defineSecret("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = defineSecret("GOOGLE_CLIENT_SECRET");

export const getBusyEvents = onCall(
  {
    region: "us-central1",
    secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET],
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError("unauthenticated", "User not authenticated");
    }

    const { start, end } = request.data ?? {};

    if (typeof start !== "string" || typeof end !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "start and end must be ISO strings",
      );
    }

    // 🔐 Token válido (auto-refresh)
    let accessToken: string;
    try {
      accessToken = await getValidGoogleAccessToken(uid);
    } catch (err) {
      console.error("Token error:", err);
      throw new HttpsError(
        "failed-precondition",
        "Google Calendar not connected",
      );
    }

    // 📅 Google FreeBusy
    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: start,
        timeMax: end,
        items: [{ id: "primary" }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Google freeBusy error:", res.status, text);

      throw new HttpsError("internal", `Google API error ${res.status}`);
    }

    const data = await res.json();

    const busy = data?.calendars?.primary?.busy;

    if (!Array.isArray(busy)) {
      console.warn("Unexpected freeBusy response:", data);
      return [];
    }

    return busy;
  },
);
