import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifySession, getSessionCookieName } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const cookieName = getSessionCookieName();
  const token = (req.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(cookieName + "="))
    ?.split("=")[1];

  if (!token) return NextResponse.json({ ok: false, error: "Nicht eingeloggt." }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ ok: false, error: "Session ungültig." }, { status: 401 });

  // du hast sehr wahrscheinlich session.sub als userId
  const user = await prisma.users.findUnique({
    where: { id: session.sub },
    select: { id: true, username: true, role: true },
  });

  if (!user) return NextResponse.json({ ok: false, error: "User nicht gefunden." }, { status: 404 });


  return NextResponse.json({
    ok: true,
    user:{
      id: user.id,
      username: user.username,
      role: user.role,
    }
  });
}