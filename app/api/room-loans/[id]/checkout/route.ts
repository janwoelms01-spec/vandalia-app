import { NextResponse } from "next/server";
import { PrismaClient, copies_state, room_loans_status } from "@prisma/client";
import { requireApiPermission } from "@/lib/api/requireApiPermissions";

const prisma = new PrismaClient();

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const perm = await requireApiPermission("ROOM_LOANS_MANAGE");
  if (!perm.ok) return perm.response;

  const loanId = params.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.room_loans.findUnique({
        where: { id: loanId },
        include: { copies: true, users: true },
      });

      if (!loan) return { ok: false as const, status: 404 as const, error: "Ausleihe nicht gefunden." };

      // idempotent
      if (loan.status === room_loans_status.OUT) return { ok: true as const, loan };

      // Status-Guards
      if (loan.status !== room_loans_status.REQUESTED && loan.status !== room_loans_status.APPROVED) {
        return { ok: false as const, status: 409 as const, error: "Ausleihe kann in diesem Status nicht ausgegeben werden." };
      }

      // Copy-Guards
      if (!loan.copies.is_active) {
        return { ok: false as const, status: 409 as const, error: "Exemplar ist deaktiviert." };
      }
      if (loan.copies.presence_only) {
        return { ok: false as const, status: 409 as const, error: "Präsenzexemplar kann nicht ausgeliehen werden." };
      }

      // ✅ Lock auf das Exemplar (nicht Title!)
      const locked = await tx.copies.updateMany({
        where: { id: loan.copy_id, state: copies_state.IN_LIBARY, is_active: true },
        data: { state: copies_state.ON_ROOM_LOAN },
      });

      if (locked.count !== 1) {
        return { ok: false as const, status: 409 as const, error: "Exemplar ist nicht verfügbar." };
      }

      const updated = await tx.room_loans.update({
        where: { id: loan.id },
        data: {
          status: room_loans_status.OUT,
          approved_at: loan.approved_at ?? new Date(),
        },
        include: { copies: true, users: true },
      });

      return { ok: true as const, loan: updated };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.loan, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Serverfehler beim Checkout." }, { status: 500 });
  }
}