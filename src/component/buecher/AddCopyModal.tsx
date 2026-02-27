"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  titleId: string;
};

export default function AddCopyModal({ titleId }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  // Öffnen über ?addCopy=1 (Link hast du ja schon)
  const isOpen = useMemo(() => sp.get("addCopy") === "1", [sp]);

  const [homeLocation, setHomeLocation] = useState("");
  const [presenceOnly, setPresenceOnly] = useState(false);
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    // Query param entfernen, zurück auf /buecher/:id
    router.replace(`/buecher/${titleId}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const hl = homeLocation.trim();
    if (!hl) {
      setError("Bitte eine Home Location eingeben.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/buecher/${titleId}/copies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_location: hl,
          presence_only: presenceOnly,
          note: note.trim() ? note.trim() : null,
        }),
      });

      const ct = res.headers.get("content-type") ?? "";
      const payload = ct.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => null);

      if (!res.ok) {
        const msg =
          (payload && typeof payload === "object" && (payload.error || payload.message)) ||
          (typeof payload === "string" ? payload : null) ||
          `Fehler (${res.status})`;
        setError(String(msg));
        return;
      }

      // Erfolg: UI aktualisieren + Modal schließen
      router.refresh();
      close();

      // optional: Form reset
      setHomeLocation("");
      setPresenceOnly(false);
      setNote("");
    } catch (err: any) {
      setError(err?.message ?? "Unbekannter Fehler");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        onClick={close}
        className="absolute inset-0 bg-black/40"
      />

      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 w-[min(560px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Exemplar hinzufügen</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Lege ein neues Exemplar für diesen Titel an.
            </p>
          </div>

          <button
            onClick={close}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-800">
              Home Location <span className="text-red-600">*</span>
            </label>
            <input
              value={homeLocation}
              onChange={(e) => setHomeLocation(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="z.B. Archiv / Regal A3"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="presence_only"
              type="checkbox"
              checked={presenceOnly}
              onChange={(e) => setPresenceOnly(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <label htmlFor="presence_only" className="text-sm text-zinc-800">
              Nur Präsenzbestand (presence_only)
            </label>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-800">Notiz</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-22,5 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
              placeholder="Optional…"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={close}
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 active:bg-zinc-950 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Speichern…" : "Exemplar anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}