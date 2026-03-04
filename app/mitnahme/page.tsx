"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Loan = {
  id: string;
  status: string;
  due_at: string | null;
  created_at: string;
  approved_at: string | null;
  returned_at: string | null;
  note: string | null;
  user_id: string;
  users?: { username?: string | null; display_name?: string | null } | null;
  copies?: {
    id: string;
    copy_code?: string | null;
    state: string;
    presence_only: boolean;
    is_active: boolean;
    titles?: { title?: string | null; author?: string | null } | null;
  } | null;
};

type TabKey = "REQUESTED" | "APPROVED" | "OUT" | "OVERDUE" | "RETURNED" | "REJECTED";

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-2 rounded-lg border text-sm",
        active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function LoansPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [tab, setTab] = useState<TabKey>((sp.get("tab") as TabKey) || "REQUESTED");
  const [mine, setMine] = useState(sp.get("mine") === "1");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (mine) p.set("mine", "1");

    if (tab === "OVERDUE") {
      p.set("overdue", "1");
    } else {
      p.set("status", tab);
    }
    return p.toString();
  }, [tab, mine]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/room-loans?${query}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Fehler beim Laden");
      setLoans(Array.isArray(j) ? j : []);
    } catch (e: any) {
      setErr(e?.message || "Fehler");
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const p = new URLSearchParams();
    p.set("tab", tab);
    if (mine) p.set("mine", "1");
    router.replace(`/loans?${p.toString()}`);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, mine]);

  async function action(path: string) {
    setErr(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Aktion fehlgeschlagen");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Fehler");
    }
  }

  function titleOf(l: Loan) {
    const t = l.copies?.titles?.title || "Ohne Titel";
    const a = l.copies?.titles?.author ? ` — ${l.copies?.titles?.author}` : "";
    return `${t}${a}`;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Ausleihen</h1>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
          />
          nur meine
        </label>
      </div>

      <div className="flex gap-2 flex-wrap">
        <TabButton active={tab === "REQUESTED"} onClick={() => setTab("REQUESTED")}>Requests</TabButton>
        <TabButton active={tab === "APPROVED"} onClick={() => setTab("APPROVED")}>Freigegeben</TabButton>
        <TabButton active={tab === "OUT"} onClick={() => setTab("OUT")}>Ausgeliehen</TabButton>
        <TabButton active={tab === "OVERDUE"} onClick={() => setTab("OVERDUE")}>Überfällig</TabButton>
        <TabButton active={tab === "RETURNED"} onClick={() => setTab("RETURNED")}>Historie</TabButton>
        <TabButton active={tab === "REJECTED"} onClick={() => setTab("REJECTED")}>Abgelehnt</TabButton>
      </div>

      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {err}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 text-xs font-medium bg-gray-50 border-b">
          <div className="col-span-5">Titel / Exemplar</div>
          <div className="col-span-2">Antragsteller</div>
          <div className="col-span-2">Fällig</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Aktion</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm">Lade…</div>
        ) : loans.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">Keine Einträge.</div>
        ) : (
          loans.map((l) => (
            <div key={l.id} className="grid grid-cols-12 gap-2 p-3 border-b items-center">
              <div className="col-span-5">
                <div className="font-medium">{titleOf(l)}</div>
                <div className="text-xs text-gray-600">
                  Copy: {l.copies?.id} {l.copies?.copy_code ? `(${l.copies.copy_code})` : ""}
                </div>
                {l.note && <div className="text-xs text-gray-600 mt-1">Notiz: {l.note}</div>}
              </div>

              <div className="col-span-2 text-sm">
                {l.users?.display_name || l.users?.username || l.user_id}
              </div>

              <div className="col-span-2 text-sm">
                {l.due_at ? new Date(l.due_at).toLocaleDateString() : "—"}
              </div>

              <div className="col-span-1 text-xs">
                <span className="rounded-md border px-2 py-1">{l.status}</span>
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                {l.status === "REQUESTED" && (
                  <>
                    <button
                      className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                      onClick={() => action(`/api/room-loans/${l.id}/approve`)}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => action(`/api/room-loans/${l.id}/reject`)}
                    >
                      Reject
                    </button>
                  </>
                )}

                {l.status === "APPROVED" && (
                  <button
                    className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                    onClick={() => action(`/api/room-loans/${l.id}/checkout`)}
                  >
                    Checkout
                  </button>
                )}

                {l.status === "OUT" && (
                  <button
                    className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                    onClick={() => action(`/api/room-loans/${l.id}/return`)}
                  >
                    Return
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}