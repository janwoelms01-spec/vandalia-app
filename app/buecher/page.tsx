// src/app/buecher/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac/permissions";
import { getBaseUrl } from "@/lib/http";

type ApiTitle = {
  id: string;
  short_code: string;
  title: string;
  authors: string | null;
  _count?: { copies?: number };
};

function normalizeAuthors(authors: string | null) {
  const a = (authors ?? "").trim();
  return a.length ? a : "—";
}

async function fetchTitles(): Promise<ApiTitle[]> {
  const baseUrl = await getBaseUrl();
  const h = await headers();

  const res = await fetch(`${baseUrl}/api/buecher`, {
    cache: "no-store",
    headers: {
      cookie: h.get("cookie") ?? "",
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got ${contentType || "unknown"} (status ${res.status}). ` +
        `Body starts with: ${text.slice(0, 120)}`
    );
  }

  const data = await res.json();

  // Dein API Response: { titles: [...] }
  const titles = Array.isArray(data?.titles) ? (data.titles as ApiTitle[]) : [];
  return titles;
}

export default async function BooksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canCreateTitle = can(session.role, "BOOK_CREATE") || can(session.role, "BOOKS_MANAGE");

  const titles = await fetchTitles();

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bücher</h1>
          <p className="mt-1 text-sm text-zinc-500">Übersicht aller Titel inkl. Exemplare</p>
        </div>

        {canCreateTitle ? (
          <Link
            href="/buecher/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 active:bg-zinc-950"
          >
            Titel hinzufügen
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="whitespace-nowrap p-3 text-left font-semibold text-zinc-700 w-47,5">
                  Short Code
                </th>
                <th className="p-3 text-left font-semibold text-zinc-700">Titel</th>
                <th className="p-3 text-left font-semibold text-zinc-700">Autor(en)</th>
                <th className="whitespace-nowrap p-3 text-right font-semibold text-zinc-700 w-30">
                  Exemplare
                </th>
              </tr>
            </thead>

            <tbody>
              {titles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-zinc-500">
                    Keine Titel gefunden.
                  </td>
                </tr>
              ) : (
                titles.map((t) => {
                  const copiesCount = t._count?.copies ?? 0;

                  return (
                    <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="p-3 font-mono text-[13px] text-zinc-700">
                        <Link href={`/buecher/${t.id}`} className="block rounded px-1 py-1 hover:underline">
                          {t.short_code}
                        </Link>
                      </td>

                      <td className="p-3">
                        <Link
                          href={`/buecher/${t.id}`}
                          className="block rounded px-1 py-1 font-medium text-zinc-900 hover:underline"
                        >
                          {t.title}
                        </Link>
                      </td>

                      <td className="p-3 text-zinc-700">
                        <Link href={`/buecher/${t.id}`} className="block rounded px-1 py-1 hover:underline">
                          {normalizeAuthors(t.authors)}
                        </Link>
                      </td>

                      <td className="p-3 text-right text-zinc-700">
                        <Link href={`/buecher/${t.id}`} className="block rounded px-1 py-1 hover:underline">
                          {copiesCount}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
