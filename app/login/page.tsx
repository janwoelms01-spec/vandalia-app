"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    console.log("submit fired");
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    console.log("about to redirect");

    console.log("login response", res.status, res.ok);
    setLoading(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Login fehlgeschlagen");
      return;
    }
    console.log("redirectin now");
    window.location.href="/";
    // router.push("/");
    // router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "64px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Bibliothek und Inventur Portall</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
          {loading ? "…" : "Einloggen"}
        </button>
      </form>
    </div>
  );
}
