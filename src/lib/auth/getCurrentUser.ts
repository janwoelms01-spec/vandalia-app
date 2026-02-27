import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "../auth"; // Pfad anpassen
import type { SessionPayload } from "../auth";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies(); // ✅ await!
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) return null;
  return await verifySession(token);
}
