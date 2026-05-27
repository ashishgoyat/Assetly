"use client";

/**
 * Dashboard error boundary — Client Component (required by Next.js)
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div
      style={{
        padding: "8px 28px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <div className="card" style={{ padding: 32, maxWidth: 440, textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--neg-soft)",
            color: "var(--neg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 24,
          }}
        >
          ⚠
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            marginBottom: 8,
          }}
        >
          Something went wrong
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {error.message ?? "An unexpected error occurred while loading your dashboard."}
        </div>
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
