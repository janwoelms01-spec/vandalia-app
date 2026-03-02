import { requireApiPermission } from "@/lib/api/requireApiPermissions";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const auth = await requireApiPermission("BOOKS_MANAGE");
  if (!auth.ok) return auth.response;

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