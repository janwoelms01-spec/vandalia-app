import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function basicAuth(user: string, pass: string) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // const auth = await requireApiPermission("BOOKS_MANAGE");
  // if (!auth.ok) return auth.response;

  const baseUrl = process.env.NEXTCLOUD_BASE_URL!;
  const username = process.env.NEXTCLOUD_USERNAME!;
  const password = process.env.NEXTCLOUD_PASSWORD!;
  const root = process.env.NEXTCLOUD_ROOT || "/Vandalia";

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Nur JPG/PNG/WEBP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max 5MB)." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Endung aus MIME
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${id}-${randomUUID()}.${ext}`;

  // Nextcloud-Zielpfad (innerhalb /Vandalia)
  const key = `Inventur/Covers/${filename}`;
  const davUrl = `${baseUrl}/remote.php/dav/files/${encodeURIComponent(username)}${root}/${key}`;

  const res = await fetch(davUrl, {
    method: "PUT",
    headers: {
      Authorization: basicAuth(username, password),
      "Content-Type": file.type,
    },
    body: buf,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `Nextcloud Upload failed (${res.status})`, detail: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const updated = await prisma.titles.update({
    where: { id },
    data: {
      cover_provider: "NEXTCLOUD",
      cover_key: key,
      // cover_url: null, // optional: wenn du externe URL “ablösen” willst
    },
    select: { id: true, cover_provider: true, cover_key: true, cover_url: true },
  });

  return NextResponse.json({ ok: true, title: updated });
}
