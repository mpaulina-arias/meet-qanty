import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const GOOGLE_CLIENT_ID = defineSecret("GOOGLE_CLIENT_ID");
const GOOGLE_REDIRECT_URI = defineSecret("GOOGLE_REDIRECT_URI");

export const oauthGoogleStart = onRequest(
  {
    region: "us-central1",
    secrets: [GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI],
  },
  (req, res) => {
    const uid = req.query.uid as string | undefined;
    const env = (req.query.env as string) ?? "dev";

    if (!uid) {
      res.status(400).send("Missing uid");
      return;
    }

    const state = encodeURIComponent(JSON.stringify({ uid, env }));

    const url =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID.value())}` +
      `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI.value())}` +
      "&response_type=code" +
      "&scope=https://www.googleapis.com/auth/calendar.readonly" +
      "&access_type=offline" +
      "&prompt=consent" +
      `&state=${state}`;

    res.redirect(url);
  },
);
