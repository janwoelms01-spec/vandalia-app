import { NextResponse } from "next/server";
// optional RBAC
// import { requireApiPermission } from "@/lib/authz";

function basicAuth(user: string, pass: string) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export async function GET(
  req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  // const auth = await requireApiPermission("BOOKS_VIEW");
  // if (!auth.ok) return auth.response;

  const baseUrl = process.env.NEXTCLOUD_BASE_URL!;
  const username = process.env.NEXTCLOUD_USERNAME!;
  const password = process.env.NEXTCLOUD_PASSWORD!;
  const root = process.env.NEXTCLOUD_ROOT || "/Vandalia";

  const relPath = path.join("/"); // z.B. Inventur/Covers/...
  const davUrl = `${baseUrl}/remote.php/dav/files/${encodeURIComponent(username)}${root}/${relPath}`;

  const upstream = await fetch(davUrl, {
    headers: { Authorization: basicAuth(username, password) },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}