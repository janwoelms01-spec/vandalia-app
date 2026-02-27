import { getSessionCookieName, verifySession } from "@/lib/auth";

import { can } from "@/lib/rbac/permissions";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = (await cookies()).get(getSessionCookieName())?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // fürs Erste: nur BOOKS_MANAGE (oder später BOOK_DELETE zusätzlich)
  if (!can(session.role, "BOOKS_MANAGE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.titles.update({
    where: { id },
    data: { is_active: false },
  });

  // empfohlen: Copies gleich mit deaktivieren
  await prisma.copies.updateMany({
    where: { title_id: id, is_active: true },
    data: { is_active: false },
  });

  return NextResponse.json({ ok: true });
}