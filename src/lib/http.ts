// src/lib/http.ts
import { headers } from "next/headers";

export async function getBaseUrl() {
  const h = await headers();

  // Vercel/Proxy-friendly
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (!host) {
    // Fallback for edge cases (dev tooling etc.)
    return "http://localhost:5000";
  }

  return `${proto}://${host}`;
}
