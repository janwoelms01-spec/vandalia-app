import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac/permissions";
import { getBaseUrl } from "@/lib/http";
import AddCopyModal from "@/component/buecher/AddCopyModal";
import CopiesEditor from "@/component/buecher/CopiesEditor";
import EditTitleModal from "@/component/buecher/EditTitleModa";

const prisma = new PrismaClient();


type CopyItem = {
  id: string;
  title_id: string;
  copy_code: string;
  home_location: string;
  presence_only: boolean;
  stock_type: string | null;
  state: "IN_LIBARY" | "ON_ROOM_LOAN" | "MISSING" | "DAMAGED" | string;
  note: string | null;
};

function prettyState(s: string) {
  switch (s) {
    case "IN_LIBARY":
      return "Im Bestand";
    case "ON_ROOM_LOAN":
      return "Ausgeliehen (Raum)";
    case "MISSING":
      return "Vermisst";
    case "DAMAGED":
      return "Beschädigt";
    default:
      return s;
  }
}

async function fetchCopies(titleId: string): Promise<CopyItem[]> {
  const baseUrl = await getBaseUrl();
  const h = await headers();

  const res = await fetch(`${baseUrl}/api/buecher/${titleId}/copies`, {
    cache: "no-store",
    headers: {
      cookie: h.get("cookie") ?? "",
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON from /api/buecher/${titleId}/copies but got ${contentType || "unknown"} (status ${res.status}). ` +
        `Body starts with: ${text.slice(0, 120)}`
    );
  }

  if (res.status === 404) return [];
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GET /api/buecher/${titleId}/copies failed: ${res.status} ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return Array.isArray(data?.copies) ? data.copies : [];
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const canAddCopy = can(session.role, "COPY_CREATE") || can(session.role, "BOOKS_MANAGE");

  // Titel-Metadaten direkt aus DB (robust und schnell)
  const  {id} = await params;

  const title = await prisma.titles.findUnique({
    where: { id },
    select: {
      id: true,
      short_code: true,
      title: true,
      authors: true,
      publisher: true,
      published_at: true,
      language: true,
      cover_url: true,
      is_active: true,
      categories: { select: { name: true, code: true } },
      subcategories: { select: { name: true, code: true } },
    },
  });

  if (!title || title.is_active === false) notFound();

  const copies = await fetchCopies(title.id);

  const canEditCopy =
  can(session.role, "COPY_UPDATE") || can(session.role, "BOOKS_MANAGE");

  const canEditTitle = can(session.role, "BOOK_UPDATE") || can(session.role, "BOOKS_MANAGE");

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs text-zinc-700">
              {title.short_code}
            </span>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900">
              {title.title}
            </h1>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
            <div>
              <span className="font-medium text-zinc-700">Autor(en): </span>
              {title.authors?.trim() ? title.authors : "—"}
            </div>
            <div>
              <span className="font-medium text-zinc-700">Verlag: </span>
              {title.publisher?.trim() ? title.publisher : "—"}
            </div>
            <div>
              <span className="font-medium text-zinc-700">Jahr/Datum: </span>
              {title.published_at?.trim() ? title.published_at : "—"}
            </div>
            <div>
              <span className="font-medium text-zinc-700">Sprache: </span>
              {title.language?.trim() ? title.language : "—"}
            </div>
            <div>
              <span className="font-medium text-zinc-700">Kategorie: </span>
              {title.categories?.name ?? "—"} / {title.subcategories?.name ?? "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/buecher"
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Zurück
          </Link>

          {canAddCopy ? (
            <Link
              href={`/buecher/${title.id}?addCopy=1`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 active:bg-zinc-950"
            >
              Exemplar hinzufügen
            </Link>
          ) : null}
          {canEditTitle ? (
      <Link
     href={`/buecher/${title.id}?editTitle=1`}
     className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
         >
     Titel bearbeiten
     </Link>
) : null}
        </div>
      </div>

      {/* Copies */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Exemplare</h2>
          <div className="text-sm text-zinc-600">
            Anzahl: <span className="font-medium text-zinc-800">{copies.length}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-zinc-700 w-60">Copy Code</th>
                  <th className="p-3 text-left font-semibold text-zinc-700 w-47,5">Status</th>
                  <th className="p-3 text-left font-semibold text-zinc-700">Home Location</th>
                  <th className="p-3 text-left font-semibold text-zinc-700 w-35">Presence only</th>
                  <th className="p-3 text-left font-semibold text-zinc-700 w-40">Stock Type</th>
                  <th className="p-3 text-left font-semibold text-zinc-700">Notiz</th>
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
                      <td className="p-3 text-zinc-700">{prettyState(c.state)}</td>
                      <td className="p-3 text-zinc-700">{c.home_location}</td>
                      <td className="p-3 text-zinc-700">{c.presence_only ? "Ja" : "Nein"}</td>
                      <td className="p-3 text-zinc-700">{c.stock_type ?? "—"}</td>
                      <td className="p-3 text-zinc-700">{c.note?.trim() ? c.note : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {canAddCopy ? <AddCopyModal titleId={title.id} /> : null}
            <CopiesEditor titleId={title.id} copies={copies as any} canEdit={canEditCopy} />
            {canEditTitle ? (
  <EditTitleModal
    title={{
      id: title.id,
      short_code: title.short_code,
      title: title.title,
      authors: title.authors,
      publisher: title.publisher,
      published_at: title.published_at,
      language: title.language,
      cover_url: title.cover_url,
    }}
  />
) : null}
          </div>
        </div>
      </div>
    </div>
  );
}