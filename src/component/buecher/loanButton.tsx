"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RequestLoanButton({ copyId }: { copyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function requestLoan() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/room-loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy_id: copyId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Konnte keine Anfrage erstellen.");

      // nice: direkt zur loans-seite (mine=1) oder zur detailansicht
      router.push("/loans?tab=REQUESTED&mine=1");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        disabled={busy}
        onClick={requestLoan}
        className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? "Sende Anfrage…" : "Ausleihe anfragen"}
      </button>
      {err && <div className="text-sm text-red-700">{err}</div>}
    </div>
  );
}