import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getSessionCookieName } from "@/lib/auth";

export async function GET() {
  const token = (await cookies()).get(getSessionCookieName())?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({
    user: {
      id: session.sub,
      username: session.username,
      role: session.role,
    },
  });
}
