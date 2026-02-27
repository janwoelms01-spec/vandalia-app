import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { can } from "@/lib/rbac/permissions";
import type { Permission } from "@/lib/rbac/permissions"; // falls Permission dort exportiert wird






export type AuthedContext = {
  session: Awaited<ReturnType<typeof verifySession>>; // SessionPayload | null
};

export async function requireApiPermission(permission: Permission) {
  const token = (await cookies()).get(getSessionCookieName())?.value;

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const session = await verifySession(token);

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!can(session.role, permission)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}

export async function requireApiAnyPermission(permissions: Permission[]) {
  const token = (await cookies()).get(getSessionCookieName())?.value;

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const session = await verifySession(token);

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const allowed = permissions.some((p) => can(session.role, p));
  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}
export async function requireApiAllPermissions(permissions: Permission[]) {
  const token = (await cookies()).get(getSessionCookieName())?.value;

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const session = await verifySession(token);

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const allowed = permissions.every((p) => can(session.role, p));
  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}
