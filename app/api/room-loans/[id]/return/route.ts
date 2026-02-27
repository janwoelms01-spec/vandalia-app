import { NextResponse, NextRequest } from "next/server";
import { PrismaClient, copies_state, room_loans_status } from "@prisma/client";
import { requireApiPermission } from "@/lib/api/requireApiPermissions";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
){
  const {id} = await params;
  const perm = await requireApiPermission("ROOM_LOANS_MANAGE");
  if (!perm.ok) return perm.response;

  const loanId = id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.room_loans.findUnique({
        where: { id: loanId },
        include: { copies: true, users: true },
      });

      if (!loan) {
        return { ok: false as const, status: 404 as const, error: "Ausleihe nicht gefunden." };
      }

      // idempotent
      if (loan.status === room_loans_status.RETURNED) {
        return { ok: true as const, loan };
      }

      // nur OUT kann zurückgegeben werden (optional: auch APPROVED/REQUESTED canceln wir später separat)
      if (loan.status !== room_loans_status.OUT) {
        return {
          ok: false as const,
          status: 409 as const,
          error: "Nur ausgegebene Ausleihen (OUT) können zurückgenommen werden.",
        };
      }

      // 1) Loan auf RETURNED setzen
      const updatedLoan = await tx.room_loans.update({
        where: { id: loan.id },
        data: {
          status: room_loans_status.RETURNED,
          returned_at: new Date(),
        },
        include: { copies: true, users: true },
      });

      // 2) Copy entsperren (defensiv, damit wir nichts kaputt machen)
      await tx.copies.updateMany({
        where: {
          id: loan.copy_id,
          state: copies_state.ON_ROOM_LOAN,
        },
        data: {
          state: copies_state.IN_LIBARY,
          // falls ihr später loan_owner/loan_until habt, könnt ihr hier nullen
          // loan_owner: null,
          // loan_until: null,
        } as any,
      });

      return { ok: true as const, loan: updatedLoan };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.loan, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Serverfehler bei Rückgabe." }, { status: 500 });
  }
}