/**
 * Dashboard loading skeleton — Server Component
 */

export default function DashboardLoading() {
  return (
    <div style={{ padding: "8px 28px 36px" }}>
      {/* Greeting skeleton */}
      <div style={{ marginBottom: 22 }}>
        <div
          className="skeleton"
          style={{ width: 120, height: 12, marginBottom: 10 }}
        />
        <div
          className="skeleton"
          style={{ width: "60%", height: 40, borderRadius: 8 }}
        />
      </div>

      {/* Action cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 140, borderRadius: 16 }}
          />
        ))}
      </div>

      {/* Row 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.9fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
      </div>

      {/* Row 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
      </div>

      {/* Row 3 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 14,
        }}
      >
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    </div>
  );
}
