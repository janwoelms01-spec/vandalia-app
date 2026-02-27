import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
export type Role = "ADMIN" | "SCRIPTOR" | "ARCHIVAR" | "MEMBER" | "GENEALOGISTAR";

export type SessionPayload = {
  sub: string;
  username: string;
  role: Role;
  mustChangePassword?: boolean;
};

function getSecretKey() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET missing. Put it in .env/.env.local and restart dev server.");
  return new TextEncoder().encode(s);
}
export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("hbv_session")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export function getSessionCookieName() {
  return process.env.JWT_COOKIE_NAME || "hbv_session";
}

export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3d")
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    if (!payload.sub || !payload.username || !payload.role) return null;

    return {
      sub: String(payload.sub),
      username: String(payload.username),
      role: payload.role as Role,
      mustChangePassword: payload.mustChangePassword as boolean | undefined,
    };
  } catch {
    return null;
  }
}

