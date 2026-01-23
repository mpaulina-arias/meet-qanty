import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getValidGoogleAccessToken } from "./refreshGoogleToken";

export const getBusyEvents = onCall(
  { region: "us-central1" },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError("unauthenticated", "User not authenticated");
    }

    const { start, end } = request.data ?? {};

    if (!start || !end) {
      throw new HttpsError("invalid-argument", "start and end are required");
    }

    const accessToken = await getValidGoogleAccessToken(uid);

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
    return data.calendars.primary.busy ?? [];
  },
);
