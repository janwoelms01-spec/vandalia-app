export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const ENV = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};