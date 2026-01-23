import { onRequest } from "firebase-functions/v2/https";
import { db, admin } from "../utils/firestore";
import { defineSecret } from "firebase-functions/params";

const GOOGLE_CLIENT_ID = defineSecret("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = defineSecret("GOOGLE_CLIENT_SECRET");
const GOOGLE_REDIRECT_URI = defineSecret("GOOGLE_REDIRECT_URI");

export const oauthGoogleCallback = onRequest(
  {
    region: "us-central1",
    secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI],
  },
  async (req, res) => {
    const code = req.query.code as string | undefined;
    const rawState = req.query.state as string | undefined;

    if (!code || !rawState) {
      res.status(400).send("Missing code or state");
      return;
    }

    let uid: string;
    let env: "dev" | "prod" = "dev";

    try {
      const parsed = JSON.parse(rawState);
      uid = parsed.uid;
      env = parsed.env ?? "dev";
    } catch {
      res.status(400).send("Invalid state");
      return;
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID.value(),
        client_secret: GOOGLE_CLIENT_SECRET.value(),
        redirect_uri: GOOGLE_REDIRECT_URI.value(),
        grant_type: "authorization_code",
      }),
    });

    const token = await tokenRes.json();

    if (!token.access_token) {
      console.error("Google token error:", token);
      res.status(500).send("Failed to obtain access token");
      return;
    }

    await db
      .collection("calendar_integrations")
      .doc(uid)
      .set({
        provider: "google",
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: admin.firestore.Timestamp.fromMillis(
          Date.now() + token.expires_in * 1000,
        ),
        scopes: token.scope?.split(" "),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const redirectUrl =
      env === "prod"
        ? "https://meet-qanty.web.app/dashboard"
        : "http://localhost:5173/dashboard";

    res.redirect(redirectUrl);
  },
);
