"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CopyItem = {
  id: string;
  title_id: string;
  copy_code: string;
  state: string;
  home_location: string;
  presence_only: boolean;
  note: string | null;
  is_active: boolean;
};

const STATES = ["IN_LIBARY", "ON_ROOM_LOAN", "MISSING", "DAMAGED"] as const;

export default function CopiesEditor({
  titleId,
  copies,
  canEdit,
}: {
  titleId: string;
  copies: CopyItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(copyId: string, payload: any) {
    setError(null);
    setSavingId(copyId);
    try {
      const res = await fetch(`/api/buecher/${titleId}/copies/${copyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `Fehler (${res.status})`);
        return;
      }

      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3 text-left font-semibold text-zinc-700 w-60">Copy Code</th>
                <th className="p-3 text-left font-semibold text-zinc-700 w-50">Status</th>
                <th className="p-3 text-left font-semibold text-zinc-700">Home Location</th>
                <th className="p-3 text-left font-semibold text-zinc-700 w-35">Presence</th>
                <th className="p-3 text-left font-semibold text-zinc-700">Notiz</th>
                <th className="p-3 text-right font-semibold text-zinc-700 w-30">Aktion</th>
              </tr>
            </thead>

            <tbody>
              {copies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-zinc-500">
                    Keine Exemplare gefunden.
                  </td>
                </tr>
              ) : (
                copies.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-3 font-mono text-[13px] text-zinc-700">{c.copy_code}</td>

                    <td className="p-3">
                      {canEdit ? (
                        <select
                          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm"
                          defaultValue={c.state}
                          disabled={savingId === c.id}
                          onChange={(e) => patch(c.id, { state: e.target.value })}
                        >
                          {STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-zinc-700">{c.state}</span>
                      )}
                    </td>

                    <td className="p-3">
                      {canEdit ? (
                        <input
                          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm"
                          defaultValue={c.home_location}
                          disabled={savingId === c.id}
                          onBlur={(e) => {
                            const next = e.target.value.trim();
                            if (next && next !== c.home_location) patch(c.id, { home_location: next });
                          }}
                        />
                      ) : (
                        <span className="text-zinc-700">{c.home_location}</span>
                      )}
                    </td>

                    <td className="p-3">
                      {canEdit ? (
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-zinc-300"
                          defaultChecked={c.presence_only}
                          disabled={savingId === c.id}
                          onChange={(e) => patch(c.id, { presence_only: e.target.checked })}
                        />
                      ) : (
                        <span className="text-zinc-700">{c.presence_only ? "Ja" : "Nein"}</span>
                      )}
                    </td>

                    <td className="p-3">
                      {canEdit ? (
                        <input
                          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm"
                          defaultValue={c.note ?? ""}
                          disabled={savingId === c.id}
                          placeholder="—"
                          onBlur={(e) => {
                            const next = e.target.value;
                            const normalized = next.trim() ? next : null;
                            if (normalized !== (c.note ?? null)) patch(c.id, { note: normalized });
                          }}
                        />
                      ) : (
                        <span className="text-zinc-700">{c.note?.trim() ? c.note : "—"}</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {canEdit ? (
                        <button
                          className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-60"
                          disabled={savingId === c.id}
                          onClick={() => patch(c.id, { is_active: false })}
                        >
                          Deaktivieren
                        </button>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Änderungen werden automatisch gespeichert (Status sofort, Textfelder beim Verlassen des Feldes).
      </p>
    </div>
  );
}