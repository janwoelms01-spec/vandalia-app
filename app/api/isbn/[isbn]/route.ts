import { NextResponse } from "next/server";

function normalizeIsbn(raw: string) {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function isValidIsbnLen(s: string) {
  return s.length === 10 || s.length === 13;
}

function pickYear(s?: string | null) {
  if (!s) return null;
  const m = String(s).match(/(19|20)\d{2}/);
  return m ? m[0] : null;
}

async function lookupOpenLibrary(isbn: string) {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const b = data?.[`ISBN:${isbn}`];
  if (!b) return null;

  const title = b?.title ?? null;
  const authors = Array.isArray(b?.authors)
    ? b.authors.map((a: any) => a?.name).filter(Boolean).join(", ")
    : null;

  const publisher = Array.isArray(b?.publishers) ? b.publishers?.[0]?.name ?? null : null;
  const published_at = pickYear(b?.publish_date) ?? (b?.publish_date ? String(b.publish_date) : null);

  const language =
    Array.isArray(b?.languages) ? (b.languages?.[0]?.key?.split("/")?.pop() ?? null) : null;

  const cover_url = b?.cover?.large ?? b?.cover?.medium ?? b?.cover?.small ?? null;

  return {
    source: "openlibrary",
    isbn,
    title,
    authors,
    publisher,
    published_at,
    language,
    cover_url,
  };
}

async function lookupGoogleBooks(isbn: string) {
  // Ohne API-Key meist ok; später kannst du key=... ergänzen
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const item = Array.isArray(data?.items) ? data.items[0] : null;
  const info = item?.volumeInfo;
  if (!info) return null;

  const title = info?.title ?? null;
  const authors = Array.isArray(info?.authors) ? info.authors.join(", ") : null;
  const publisher = info?.publisher ?? null;
  const published_at = pickYear(info?.publishedDate) ?? (info?.publishedDate ? String(info.publishedDate) : null);

  const language = info?.language ?? null;

  const img = info?.imageLinks ?? {};
  const cover_url =
    img?.thumbnail ?? img?.smallThumbnail ?? null;

  return {
    source: "googlebooks",
    isbn,
    title,
    authors,
    publisher,
    published_at,
    language,
    cover_url,
  };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await context.params;
  const norm = normalizeIsbn(isbn);

  if (!norm || !isValidIsbnLen(norm)) {
    return NextResponse.json({ error: "Invalid ISBN" }, { status: 400 });
  }

  const ol = await lookupOpenLibrary(norm);
  if (ol?.title) return NextResponse.json(ol);

  const gb = await lookupGoogleBooks(norm);
  if (gb?.title) return NextResponse.json(gb);

  return NextResponse.json({ error: "Not found", isbn: norm }, { status: 404 });
}