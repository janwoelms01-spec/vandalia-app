import { copies_state, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiAnyPermission } from "@/lib/api/requireApiPermissions";

const prisma = new PrismaClient();

 export async function PATCH(
    req: Request,
    context: {params: Promise<{id: string; copyId: string}>}
  ){
    const {id: titleId, copyId} = await context.params;

    //Auth
    const auth = await requireApiAnyPermission(["COPY_UPDATE", "BOOKS_MANAGE"]);
    if (!auth.ok) return auth.response;
    
    //Body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({error: "Invalid JSON"}, {status: 400});
    }
    const patch : any = {};
    if (body?.state != null) {  
      const s = String(body.state);
      if(!(s in copies_state)){
              return NextResponse.json(
        { error: "Invalid state", allowed: Object.keys(copies_state) },
        { status: 400 }
      );
      }
      patch.state = (copies_state as any)[s];
    }
     if (body?.home_location != null) {
    const hl = String(body.home_location).trim();
    if (!hl) return NextResponse.json({ error: "home_location cannot be empty" }, { status: 400 });
    patch.home_location = hl;
  }

  if (body?.note !== undefined) {
    patch.note = body.note === null ? null : String(body.note);
  }

  if (body?.presence_only !== undefined) {
    patch.presence_only = Boolean(body.presence_only);
  }

  if (body?.is_active !== undefined) {
    patch.is_active = Boolean(body.is_active);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Ensure copy belongs to title (optional but recommended)
  const existing = await prisma.copies.findUnique({
    where: { id: copyId },
    select: { id: true, title_id: true },
  });

  if (!existing || existing.title_id !== titleId) {
    return NextResponse.json({ error: "Copy not found" }, { status: 404 });
  }

  const updated = await prisma.copies.update({
    where: { id: copyId },
    data: patch,
    select: {
      id: true,
      title_id: true,
      copy_code: true,
      state: true,
      home_location: true,
      presence_only: true,
      note: true,
      is_active: true,
      updated_at: true, // falls vorhanden
    },
  });

  return NextResponse.json({ copy: updated });
  }