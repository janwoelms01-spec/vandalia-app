"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CoverUpload({ titleId }: { titleId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setMsg(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`/api/buecher/${titleId}/cover/upload`, {
      method: "POST",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMsg(data.error || "Upload fehlgeschlagen");
      setLoading(false);
      return;
    }

    setMsg("Cover erfolgreich hochgeladen");
    setLoading(false);
    router.refresh(); // wichtig bei Server Components
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="px-3 py-2 border rounded bg-zinc-800 text-white disabled:opacity-50"
      >
        {loading ? "Upload läuft..." : "Cover hochladen"}
      </button>

      {msg && <span className="text-sm text-zinc-600">{msg}</span>}
    </div>
  );
}