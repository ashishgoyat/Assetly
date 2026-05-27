/**
 * Global 404 page — Server Component
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--f-sans)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--f-display)",
            fontSize: 96,
            lineHeight: 1,
            color: "var(--border)",
            letterSpacing: "-0.04em",
          }}
        >
          404
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--ink)",
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Page not found
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 32 }}>
          This page doesn&apos;t exist or was moved.
        </div>
        <Link href="/dashboard" className="btn btn-primary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
