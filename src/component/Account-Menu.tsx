"use client";

import type { SessionPayload } from "@/lib/auth";

export default function AccountMenu({
  user,
}: {
  user: SessionPayload | null;
}) {
  if (!user) return null;

  return (
    <details style={{ position: "relative" }}>
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          userSelect: "none",
          padding: "6px 10px",
          border: "1px solid #eee",
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 600 }}>{user.username}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{user.role}</span>
        <span style={{ opacity: 0.6 }}>▾</span>
      </summary>

      {/* Dropdown Panel */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 8px)",
          minWidth: 220,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          zIndex: 50,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>{user.username}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{user.role}</div>
          {user.mustChangePassword ? (
            <div style={{ marginTop: 6, fontSize: 12, color: "#b45309" }}>
              Passwort muss geändert werden
            </div>
          ) : null}
        </div>

        <div style={{ height: 1, background: "#eee", margin: "10px 0" }} />

        {/* Logout: POST to /api/logout (Browser follows redirect to /login) */}
        <form action="/api/logout" method="post">
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #eee",
              background: "white",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Logout
          </button>
        </form>
      </div>

      {/* Optional: remove default marker in some browsers */}
      <style jsx>{`
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </details>
  );
}
