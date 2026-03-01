export function publicOrigin() {
  const u = process.env.APP_URL;
  if (!u) throw new Error("APP_URL missing");
  return u.replace(/\/+$/, "");
}

export function publicUrl(path: string) {
  return new URL(path, publicOrigin()).toString();
}