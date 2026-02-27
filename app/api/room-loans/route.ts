import { NextResponse } from "next/server";
import { PrismaClient, copies_state, room_loans_status } from "@prisma/client";
import { requireApiPermission } from "@/lib/api/requireApiPermissions";

const prisma = new PrismaClient();

function newId25() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

type Body = {
  copy_id: string;
  due_at?: string;
  note?: string;
};
export async function GET(req: Request) {
  const perm = await requireApiPermission("ROOM_LOANS_READ");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const mine = searchParams.get("mine");
  const overdue = searchParams.get("overdue");

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (mine === "1") {
    where.user_id = perm.session.sub;
  }

  if (overdue === "1") {
    where.status = room_loans_status.OUT;
    where.due_at = { lt: new Date() };
  }

  const loans = await prisma.room_loans.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      copies: {
        include: { titles: true },
      },
      users: true,
    },
  });

  return NextResponse.json(loans);
}
export async function POST(req: Request) {
  const perm = await requireApiPermission("ROOM_LOANS_REQUEST");
  if (!perm.ok) return perm.response;          // ✅ wichtig
  const session = perm.session;               // ✅ jetzt typ-sicher

  const body = (await req.json()) as Body;

  if (!body.copy_id) {
    return NextResponse.json({ error: "copy_id ist erforderlich." }, { status: 400 });
  }

  try {
    const copy = await prisma.copies.findUnique({
      where: { id: body.copy_id },
      select: { id: true, is_active: true, presence_only: true, state: true },
    });

    if (!copy) return NextResponse.json({ error: "Exemplar nicht gefunden." }, { status: 404 });
    if (!copy.is_active) return NextResponse.json({ error: "Exemplar ist deaktiviert." }, { status: 409 });
    if (copy.presence_only) return NextResponse.json({ error: "Präsenzexemplar kann nicht ausgeliehen werden." }, { status: 409 });
    if (copy.state !== copies_state.IN_LIBARY) return NextResponse.json({ error: "Exemplar ist aktuell nicht verfügbar." }, { status: 409 });

    const dueDate = body.due_at
      ? new Date(body.due_at)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 14);
          d.setHours(23, 59, 0, 0);
          return d;
        })();

    const loan = await prisma.room_loans.create({
      data: {
        id: newId25(),
        copy_id: copy.id,
        user_id: session.sub, // ✅ jetzt gültig
        due_at: dueDate,
        status: room_loans_status.REQUESTED,
        note: body.note ?? null,
      },
      include: {
        copies: { include: { titles: true } },
        users: true,
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Serverfehler beim Erstellen der Ausleihe." }, { status: 500 });
  }
}