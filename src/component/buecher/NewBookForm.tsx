"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeIsbn(raw: string) {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function looksValidIsbn(raw: string) {
  const n = normalizeIsbn(raw);
  return n.length === 10 || n.length === 13;
}

export default function NewBookForm() {
  const router = useRouter();

  // --- ISBN lookup state
  const [isbn, setIsbn] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "notfound" | "error">("idle");
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const lastLookup = useRef<string>("");

  // --- form fields
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [language, setLanguage] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [mediaType, setMediaType] = useState<string>("BOOK"); // <-- an deine titles_media_type anpassen
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeIsbn(isbn), [isbn]);

  // --- Auto lookup (debounced)
  useEffect(() => {
    setLookupMsg(null);

    if (!looksValidIsbn(isbn)) {
      setLookupStatus("idle");
      return;
    }

    // already looked up this isbn
    if (normalized && lastLookup.current === normalized) return;

    const t = setTimeout(async () => {
      try {
        setLookupStatus("loading");
        lastLookup.current = normalized;

        const res = await fetch(`/api/isbn/${encodeURIComponent(normalized)}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setLookupStatus(res.status === 404 ? "notfound" : "error");
          setLookupMsg(data?.error ?? `Lookup Fehler (${res.status})`);
          return;
        }

        setLookupStatus("found");
        setLookupMsg(`Datenquelle: ${data?.source ?? "unknown"}`);

        // Prefill: nur überschreiben, wenn Feld leer ist (damit man manuell korrigieren kann)
        if (!title && data?.title) setTitle(String(data.title));
        if (!authors && data?.authors) setAuthors(String(data.authors));
        if (!publisher && data?.publisher) setPublisher(String(data.publisher));
        if (!publishedAt && data?.published_at) setPublishedAt(String(data.published_at));
        if (!language && data?.language) setLanguage(String(data.language));
        if (!coverUrl && data?.cover_url) setCoverUrl(String(data.cover_url));
      } catch (e: any) {
        setLookupStatus("error");
        setLookupMsg(e?.message ?? "Lookup Fehler");
      }
    }, 450); // debounce

    return () => clearTimeout(t);
  }, [isbn, normalized, title, authors, publisher, publishedAt, language, coverUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = title.trim();
    const cat = categoryName.trim();
    const mt = mediaType.trim();

    if (!t) return setError("Titel ist erforderlich.");
    if (!cat) return setError("Kategorie ist erforderlich.");
    if (!mt) return setError("Medienform ist erforderlich.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/buecher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          authors: authors.trim() ? authors.trim() : null,
          publisher: publisher.trim() ? publisher.trim() : null,
          published_at: publishedAt.trim() ? publishedAt.trim() : null,
          language: language.trim() ? language.trim() : null,
          cover_url: coverUrl.trim() ? coverUrl.trim() : null,

          media_type: mt,
          category_name: cat,
          subcategory_name: subcategoryName.trim() ? subcategoryName.trim() : null,

          // optional: ISBN mitsenden (wenn du es im POST sauber verarbeitest)
          identifier_type: looksValidIsbn(isbn) ? "ISBN" : "NONE",
          identifier_value: looksValidIsbn(isbn) ? normalized : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `Fehler (${res.status})`);
        return;
      }

      // Dein POST antwortet: { title: created }
      const createdId = data?.title?.id;
      if (createdId) {
        router.replace(`/buecher/${createdId}`);
        router.refresh();
      } else {
        // fallback: zur liste
        router.replace("/buecher");
        router.refresh();
      }
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-800">ISBN (Auto-Fill)</label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            placeholder="ISBN 10/13 (mit oder ohne Bindestriche)"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
            {lookupStatus === "loading" ? "Suche…" :
             lookupStatus === "found" ? "Gefunden" :
             lookupStatus === "notfound" ? "Nicht gefunden" :
             lookupStatus === "error" ? "Fehler" : "—"}
          </div>
        </div>
        {lookupMsg ? <p className="text-xs text-zinc-500">{lookupMsg}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium text-zinc-800">
            Titel <span className="text-red-600">*</span>
          </label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-800">Autor(en)</label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-800">Verlag</label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-800">Erscheinungsjahr/-datum</label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            placeholder="z.B. 2004 oder 2004-05-12"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-800">Sprache</label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="z.B. de"
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium text-zinc-800">Cover URL</label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-800">
            Medienform <span className="text-red-600">*</span>
          </label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            placeholder='z.B. "BOOK" (Enum)'
          />
          <p className="text-xs text-zinc-500">
            (Später machen wir hier ein Dropdown aus deinem Prisma Enum.)
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-800">
            Kategorie <span className="text-red-600">*</span>
          </label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="z.B. Historie"
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium text-zinc-800">Subkategorie (optional)</label>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={subcategoryName}
            onChange={(e) => setSubcategoryName(e.target.value)}
            placeholder="z.B. Allgemein"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? "Speichere…" : "Titel anlegen"}
        </button>
      </div>
    </form>
  );
}
