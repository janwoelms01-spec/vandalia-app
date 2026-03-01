// src/lib/http.ts
export function getBaseUrl() {
  // Browser: relative requests (gleiches Origin)
  if (typeof window !== "undefined") return "";

  // Server: explizite App-URL nutzen
  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl.replace(/\/+$/, ""); // trailing slash weg

  // Fallback nur für lokale Entwicklung
  return "http://localhost:3000";
}