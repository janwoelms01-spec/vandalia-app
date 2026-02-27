import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import NewBookForm from "@/component/buecher/NewBookForm";
import { can } from "@/lib/rbac/permissions";

export default async function NewBookPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canCreateTitle = can(session.role, "BOOK_CREATE") || can(session.role, "BOOKS_MANAGE");
  if (!canCreateTitle) redirect("/buecher");

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Titel hinzufügen</h1>
          <p className="mt-1 text-sm text-zinc-500">
            ISBN eingeben → Daten werden automatisch vorgeschlagen → prüfen und speichern.
          </p>
        </div>
        <Link
          href="/buecher"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Zurück
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <NewBookForm />
      </div>
    </div>
  );
}