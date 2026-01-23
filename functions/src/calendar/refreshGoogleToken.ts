import { db, admin } from "../utils/firestore";

export async function getValidGoogleAccessToken(uid: string): Promise<string> {
  const ref = db.collection("calendar_integrations").doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error("Calendar not connected");
  }

  const data = snap.data()!;
  const expiresAt = data.expiresAt.toMillis();

  if (Date.now() < expiresAt - 60_000) {
    return data.accessToken;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: data.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const token = await res.json();

  await ref.update({
    accessToken: token.access_token,
    expiresAt: admin.firestore.Timestamp.fromMillis(
      Date.now() + token.expires_in * 1000,
    ),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return token.access_token;
}
