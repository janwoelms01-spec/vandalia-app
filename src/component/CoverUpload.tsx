"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CoverUpload({ titleId }: { titleId: string }) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fileInfo = useMemo(() => {
    if (!file) return null;
    return `${file.name} · ${formatBytes(file.size)} · ${file.type}`;
  }, [file]);

  function validate(f: File): string | null {
    if (!ALLOWED.has(f.type)) return "Nur JPG, PNG oder WEBP erlaubt.";
    if (f.size > MAX_BYTES) return "Datei zu groß (max 5 MB).";
    return null;
  }

  async function upload(f: File) {
    const err = validate(f);
    if (err) {
      setMsg(err);
      return;
    }

    setLoading(true);
    setMsg(null);

    const fd = new FormData();
    fd.append("file", f);

    const res = await fetch(`/api/buecher/${titleId}/cover/upload`, {
      method: "POST",
      body: fd,
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(j.error || "Upload fehlgeschlagen");
      setLoading(false);
      return;
    }

    setMsg("Cover hochgeladen.");
    setLoading(false);
    setFile(null);
    router.refresh();
  }

  function onPick(f: File | null) {
    if (!f) return;
    setFile(f);
    void upload(f);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={[
          "rounded-lg border p-4",
          "bg-white",
          isDragging ? "border-zinc-800" : "border-zinc-200",
          loading ? "opacity-70 pointer-events-none" : "",
        ].join(" ")}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0] || null;
          onPick(f);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-sm text-zinc-900">
              Cover hierher ziehen
            </div>
            <div className="text-xs text-zinc-500">
              JPG/PNG/WEBP, max 5 MB
            </div>
            {fileInfo && (
              <div className="mt-1 text-xs text-zinc-700 truncate">{fileInfo}</div>
            )}
          </div>

          <label className="shrink-0">
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onPick(e.target.files?.[0] || null)}
            />
            <span className="inline-flex cursor-pointer select-none items-center rounded-md border border-zinc-200 bg-zinc-800 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-900">
              Datei auswählen
            </span>
          </label>
        </div>
      </div>

      {msg && <div className="text-xs text-zinc-600">{msg}</div>}
      {loading && <div className="text-xs text-zinc-500">Upload läuft…</div>}
    </div>
  );
}