import { db, admin } from "../utils/firestore";
import { defineSecret } from "firebase-functions/params";

const GOOGLE_CLIENT_ID = defineSecret("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = defineSecret("GOOGLE_CLIENT_SECRET");

export async function getValidGoogleAccessToken(uid: string): Promise<string> {
  const ref = db.collection("calendar_integrations").doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error("Calendar not connected");
  }

  const data = snap.data()!;
  const expiresAt = data.expiresAt.toMillis();

  // 🟢 Token aún válido (con buffer de 1 min)
  if (Date.now() < expiresAt - 60_000) {
    return data.accessToken;
  }

  // 🔄 Refresh token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID.value(),
      client_secret: GOOGLE_CLIENT_SECRET.value(),
      refresh_token: data.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const token = await res.json();

  if (!token.access_token) {
    console.error("Google refresh token error:", token);
    throw new Error("Failed to refresh Google access token");
  }

  const newExpiresAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + token.expires_in * 1000,
  );

  await ref.update({
    accessToken: token.access_token,
    expiresAt: newExpiresAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return token.access_token;
}
