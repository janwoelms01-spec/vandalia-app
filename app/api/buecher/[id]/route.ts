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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const auth = await requireApiPermission("BOOKS_MANAGE");
  if (!auth.ok) return auth.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: any = {};

  if (body?.title != null) {
    patch.title = String(body.title).trim();
  }
  if (body?.short_code != null) {
    patch.short_code = String(body.short_code).trim();
  }
  if (body?.is_active !== undefined) {
    patch.is_active = Boolean(body.is_active);
  }

  if (body?.cover_url !== undefined) {
    patch.cover_url =
      body.cover_url === null
        ? null
        : typeof body.cover_url === "string"
          ? body.cover_url.trim()
          : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.titles.update({
    where: { id },
    data: patch,
    select: {
      id: true,
      title: true,
      short_code: true,
      is_active: true,
      cover_url: true,
      updated_at: true,
    },
  });

  return NextResponse.json({ title: updated });
}
