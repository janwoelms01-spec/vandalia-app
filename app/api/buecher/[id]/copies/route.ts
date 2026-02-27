import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { copies_state, PrismaClient } from "@prisma/client";
import crypto from "crypto";

import { verifySession, getSessionCookieName } from "@/lib/auth";
import { can } from "@/lib/rbac/permissions";
import { error } from "console";
import CopiesEditor from "@/component/buecher/CopiesEditor";

// Optional: wenn du den Helper schon hast, nutz ihn.
// import { getIdParam } from "@/lib/api/routeParams";

const prisma = new PrismaClient();

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Euer Pattern: 25 Zeichen (wie in create-admin.js)
function newId25() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

/**
 * POST /api/buecher/:id/copies
 * Body: { home_location: string, note?: string, presence_only?: boolean, ... optional }
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // --- Next.js 16: params ist Promise ---
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing route param id" }, { status: 400 });
    }

    // --- Auth ---
    const token = (await cookies()).get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- RBAC (Copy anlegen) ---
    // Du kannst hier auch nur COPY_CREATE nehmen, aber fallback auf BOOKS_MANAGE ist ok.
    if (!can(session.role, "COPY_CREATE") && !can(session.role, "BOOKS_MANAGE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Body ---
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const homeLocation = String(body?.home_location ?? "").trim();
    if (!homeLocation) {
      return NextResponse.json({ error: "home_location is required" }, { status: 400 });
    }

    // Optional-Felder (nur nutzen, wenn du sie wirklich im Schema hast)
    const note = body?.note != null ? String(body.note) : null;
    const presenceOnly =
      typeof body?.presence_only === "boolean" ? body.presence_only : undefined;

    // --- Title laden (Base short_code holen) ---
    const title = await prisma.titles.findUnique({
      where: { id },
      select: { id: true, short_code: true, is_active: true },
    });

    if (!title || title.is_active === false) {
      return NextResponse.json({ error: "Title not found" }, { status: 404 });
    }

    const base = String(title.short_code ?? "").trim(); // z.B. KAT-SUB-0007
    if (!base) {
      return NextResponse.json({ error: "Title has no short_code" }, { status: 400 });
    }

    // --- Nächsten copy_code bestimmen ---
    // Wir suchen die höchste copy_code für diesen Titel und inkrementieren die letzte Zahl.
    // Wichtig: copy_code muss so formatiert sein, dass die Endnummer zweistellig ist (01,02,...),
    // dann klappt "desc" als String-Sortierung.
    const latest = await prisma.copies.findFirst({
      where: {
        title_id: title.id, // falls bei dir titleId heißt: anpassen
        is_active: true,    // falls Feld nicht existiert: entfernen
      },
      orderBy: { copy_code: "desc" },
      select: { copy_code: true },
    });

    let nextNo = 1;
    if (latest?.copy_code) {
      const parts = latest.copy_code.split("-");
      const last = parts[parts.length - 1];
      const parsed = Number(last);
      if (!Number.isNaN(parsed)) nextNo = parsed + 1;
    }

    // --- Create mit Retry (Race Condition / Unique) ---
    for (let attempt = 0; attempt < 3; attempt++) {
      const copyCode = `${base}-${pad2(nextNo)}`;

      try {
        const created = await prisma.copies.create({
          data: {
            id: newId25(),
            title_id: title.id,     // falls bei dir titleId heißt: anpassen
            copy_code: copyCode,    // unique
            home_location: homeLocation,
            is_active: true,

            // Optional nur setzen, wenn du sie hast:
            ...(note !== null ? { note } : {}),
            ...(presenceOnly !== undefined ? { presence_only: presenceOnly } : {}),
          },
          select: {
            id: true,
            title_id: true,
            copy_code: true,
            home_location: true,
            state: true,       // falls vorhanden
            created_at: true,  // falls vorhanden
          },
        });

        return NextResponse.json({ copy: created }, { status: 201 });
      } catch (e: any) {
        // Unique violation (z.B. copy_code already exists)
        if (e?.code === "P2002" && attempt < 2) {
          nextNo += 1;
          continue;
        }

        console.error("CREATE COPY ERROR:", e);

        // Dev: mehr Info zurückgeben (optional)
        if (process.env.NODE_ENV !== "production") {
          return NextResponse.json(
            { error: "Create copy failed", prismaCode: e?.code ?? null, message: e?.message ?? String(e) },
            { status: 500 }
          );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Create copy failed (retry limit)" }, { status: 500 });
  } catch (e: any) {
    console.error("POST /copies fatal:", e);
    return NextResponse.json(
      { error: "Internal Server Error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}


export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // Next.js 16: params ist Promise
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing route param id" }, { status: 400 });
  }
  const token = (await cookies()).get(getSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- RBAC (Copy anlegen) ---
    //  nehmen, aber fallback auf BOOKS_READ ist ok.
    if ( !can(session.role, "BOOKS_READ")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const copies = await prisma.copies.findMany({
      where: {
        title_id: id,
        is_active: true,
      },
      orderBy: {copy_code: "asc"},
      select:{
        id: true,
        title_id: true,
        copy_code: true,
        home_location: true,
        presence_only: true,
        stock_type: true,
        state: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });
    return NextResponse.json({copies});
  }

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing route param id" }, { status: 400 });

  // Auth
  const token = (await cookies()).get(getSessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RBAC: Titel bearbeiten
  if (!can(session.role, "BOOK_UPDATE") && !can(session.role, "BOOKS_MANAGE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: any = {};

  // Pflichtfeld title (wenn gesendet, muss es nicht-leer sein)
  if (body?.title !== undefined) {
    const t = String(body.title ?? "").trim();
    if (!t) return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    patch.title = t;
  }

  // optionale Strings (wenn gesendet, trimmen; leer => null)
  const opt = (k: string) => {
    if (body?.[k] === undefined) return;
    const v = String(body[k] ?? "").trim();
    patch[k] = v.length ? v : null;
  };

  opt("authors");
  opt("publisher");
  opt("published_at");
  opt("language");
  opt("cover_url");

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Existenz + is_active check
  const existing = await prisma.titles.findUnique({
    where: { id },
    select: { id: true, is_active: true },
  });

  if (!existing || existing.is_active === false) {
    return NextResponse.json({ error: "Title not found" }, { status: 404 });
  }

  const updated = await prisma.titles.update({
    where: { id },
    data: patch,
    select: {
      id: true,
      short_code: true,
      title: true,
      authors: true,
      publisher: true,
      published_at: true,
      language: true,
      cover_url: true,
      updated_at: true, // falls vorhanden
    },
  });

  return NextResponse.json({ title: updated });
}

