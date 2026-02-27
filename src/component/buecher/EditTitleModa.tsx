"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";



type Title = {
  id: string;
  short_code: string;
  title: string;
  authors: string | null;
  publisher: string | null;
  published_at: string | null;
  language: string | null;
  cover_url: string | null;
};

export default function EditTitleModal({ title }: { title: Title }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const isOpen = useMemo(() => sp.get("editTitle") === "1", [sp]);

  const [t, setT] = useState(title.title ?? "");
  const [authors, setAuthors] = useState(title.authors ?? "");
  const [publisher, setPublisher] = useState(title.publisher ?? "");
  const [publishedAt, setPublishedAt] = useState(title.published_at ?? "");
  const [language, setLanguage] = useState(title.language ?? "");
  const [coverUrl, setCoverUrl] = useState(title.cover_url ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    router.replace(`/buecher/${title.id}`);
  }

   async function onDelete() {
    setError(null);
    const ok = confirm(
      "Titel wirklich deaktivieren?\n\nDer Titel verschwindet aus der Liste. Exemplare werden ebenfalls deaktiviert."
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/buecher/${title.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? `Fehler (${res.status})`);
        return;
      }

      router.replace("/buecher");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler");
    } finally {
      setIsDeleting(false);
    }
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nextTitle = t.trim();
    if (!nextTitle) {
      setError("Titel darf nicht leer sein.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/buecher/${title.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nextTitle,
          authors: authors.trim() ? authors.trim() : null,
          publisher: publisher.trim() ? publisher.trim() : null,
          published_at: publishedAt.trim() ? publishedAt.trim() : null,
          language: language.trim() ? language.trim() : null,
          cover_url: coverUrl.trim() ? coverUrl.trim() : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `Fehler (${res.status})`);
        return;
      }

      router.refresh();
      close();
    } catch (err: any) {
      setError(err?.message ?? "Unbekannter Fehler");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close modal" onClick={close} className="absolute inset-0 bg-black/40" />

      <div className="absolute left-1/2 top-1/2 w-[min(720px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Titel bearbeiten</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {title.short_code}
            </p>
          </div>

          <button onClick={close} className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-zinc-800">
                Titel <span className="text-red-600">*</span>
              </label>
              <input
                value={t}
                onChange={(e) => setT(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-800">Autor(en)</label>
              <input
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-800">Verlag</label>
              <input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-800">Erscheinungsdatum/Jahr</label>
              <input
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                placeholder="z.B. 2004 oder 2004-05-12"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-800">Sprache</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                placeholder="z.B. DE"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-zinc-800">Cover URL</label>
              <input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
          

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
              <button
              type="button"
              onClick={onDelete}
              disabled={isSubmitting || isDeleting}
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
            >
              {isDeleting ? "Deaktiviere…" : "Titel deaktivieren"}
            </button>

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
              {isSubmitting ? "Speichern…" : "Änderungen speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}