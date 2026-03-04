import { NextResponse, NextRequest } from "next/server";
import { PrismaClient, copies_state, room_loans_status } from "@prisma/client";
import { requireApiPermission } from "@/lib/api/requireApiPermissions";

const prisma = new PrismaClient();

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requireApiPermission("ROOM_LOANS_MANAGE");
  if (!perm.ok) return perm.response;

  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.room_loans.findUnique({
        where: { id },
        include: { copies: true, users: true },
      });

      if (!loan) {
        return { ok: false as const, status: 404 as const, error: "Ausleihe nicht gefunden." };
      }

      // idempotent
      if (loan.status === room_loans_status.RETURNED) {
        return { ok: true as const, loan };
      }

      if (loan.status !== room_loans_status.OUT) {
        return {
          ok: false as const,
          status: 409 as const,
          error: "Nur ausgegebene Ausleihen (OUT) können zurückgenommen werden.",
        };
      }

      // 1) Copy entsperren (mit Check)
      const unlocked = await tx.copies.updateMany({
        where: { id: loan.copy_id, state: copies_state.ON_ROOM_LOAN },
        data: { state: copies_state.IN_LIBARY },
      });

      if (unlocked.count !== 1) {
        return {
          ok: false as const,
          status: 409 as const,
          error: "Exemplar konnte nicht entsperrt werden (unerwarteter Zustand).",
        };
      }

      // 2) Loan finalisieren
      const updatedLoan = await tx.room_loans.update({
        where: { id: loan.id },
        data: { status: room_loans_status.RETURNED, returned_at: new Date() },
        include: { copies: true, users: true },
      });

      return { ok: true as const, loan: updatedLoan };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.loan, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Serverfehler bei Rückgabe." }, { status: 500 });
  }
}