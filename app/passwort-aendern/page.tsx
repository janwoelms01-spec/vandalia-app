"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Fehler");
      return;
    }

    setOk("Passwort geändert.");
    router.push("/");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 460, margin: "64px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Passwort ändern</h1>
      <p style={{ marginBottom: 12 }}>
        Beim ersten Login musst du dein Passwort ändern.
      </p>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Aktuelles Passwort</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Neues Passwort (mind. 8 Zeichen)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {ok && <p style={{ color: "green" }}>{ok}</p>}

        <button type="submit" style={{ padding: "8px 12px" }}>
          Speichern
        </button>
      </form>
    </main>
  );
}
