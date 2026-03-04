import { NextResponse } from "next/server";
import { PrismaClient, room_loans_status } from "@prisma/client";
import { requireApiPermission } from "@/lib/api/requireApiPermissions";

const prisma = new PrismaClient();

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const perm = await requireApiPermission("ROOM_LOANS_MANAGE");
  if (!perm.ok) return perm.response;

  const loanId = params.id;

  try {
    const loan = await prisma.room_loans.findUnique({
      where: { id: loanId },
      include: { copies: true, users: true },
    });

    if (!loan) {
      return NextResponse.json({ error: "Ausleihe nicht gefunden." }, { status: 404 });
    }

    // idempotent: schon approved/OUT -> ok
    if (loan.status === room_loans_status.APPROVED || loan.status === room_loans_status.OUT) {
      return NextResponse.json(loan, { status: 200 });
    }

    // Nur REQUESTED kann freigegeben werden
    if (loan.status !== room_loans_status.REQUESTED) {
      return NextResponse.json(
        { error: "Ausleihe kann in diesem Status nicht freigegeben werden." },
        { status: 409 }
      );
    }

    const updated = await prisma.room_loans.update({
      where: { id: loanId },
      data: {
        status: room_loans_status.APPROVED,
        approved_at: new Date(),
      },
      include: {
        copies: { include: { titles: true } },
        users: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Serverfehler beim Freigeben." }, { status: 500 });
  }
}