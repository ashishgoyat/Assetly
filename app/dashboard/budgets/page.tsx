/**
 * Budgets page — Server Component
 */

import Icon from "@/app/components/ui/Icon";
import DonutChart from "@/app/components/charts/DonutChart";
import type { BudgetSummary } from "@/contracts/api-contracts";
import { MOCK_BUDGETS } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/format";

async function getBudgetData(): Promise<BudgetSummary> {
  try {
    // TODO: awaiting backend — expects GET /api/budgets, see contracts/api-contracts.ts
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/budgets`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as BudgetSummary;
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.error("[budgets] API not available, using mock data:", err);
    return MOCK_BUDGETS;
  }
}

export default async function BudgetsPage() {
  const data = await getBudgetData();
  const { month, daysLeft, totalSpentInCents, totalLimitInCents, percentageUsed, remainingInCents, dailyLimitGoingForwardInCents, budgets, dailySpendHistory, vsLastMonth } = data;

  const heatmapIntensityColors = [
    "transparent",
    "#f5edd9",
    "#ecdfc0",
    "#d9c098",
    "#c96442",
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            className="serif"
            style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}
          >
            Budgets
          </h1>
          <div className="muted" style={{ marginTop: 4 }}>
            {month} · {daysLeft} days left in the month
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" type="button">
            {month.split(" ")[0]} <Icon name="chevd" size={11} />
          </button>
          <button className="btn btn-sm btn-primary" type="button">
            <Icon name="plus" size={13} /> New budget
          </button>
        </div>
      </div>

      <div className="grid-2col-budgets">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Hero summary */}
          <div
            className="card-accent"
            style={{ padding: 24, display: "flex", gap: 24, alignItems: "center" }}
          >
            <DonutChart
              size={140}
              strokeW={18}
              label={`${Math.round(percentageUsed)}%`}
              sub="used"
              segs={budgets.map((b) => ({
                v: Math.min(b.spentInCents, b.limitInCents),
                c: b.color,
                label: b.name,
              }))}
            />
            <div style={{ flex: 1 }}>
              <div
                className="sec-label"
                style={{ color: "var(--accent-2)" }}
              >
                Spent of {formatCurrency(totalLimitInCents)} monthly budget
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <span
                  className="serif num"
                  style={{ fontSize: 44, lineHeight: 1 }}
                >
                  {formatCurrency(totalSpentInCents)}
                </span>
                <span style={{ color: "var(--ink-3)" }}>
                  · {formatCurrency(remainingInCents)} left
                </span>
              </div>
              <div
                className="bar lg"
                style={{ marginTop: 14, background: "var(--surface)" }}
              >
                <i
                  style={{
                    background: "var(--accent)",
                    transform: `scaleX(${Math.min(percentageUsed, 100) / 100})`,
                  }}
                />
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-2)" }}>
                You&apos;re on track — daily limit going forward:{" "}
                <span className="num" style={{ fontWeight: 600 }}>
                  {formatCurrency(dailyLimitGoingForwardInCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Budget cards */}
          {budgets.map((b) => (
            <div key={b.id} className="card" style={{ padding: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  className="merchant-icon"
                  style={{
                    background: b.color + "20",
                    color: b.color,
                    width: 40,
                    height: 40,
                  }}
                  aria-hidden
                >
                  <Icon name={b.icon as "cart"} size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: b.isOver ? "var(--neg)" : "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    {b.isOver
                      ? `Over by ${formatCurrency(b.spentInCents - b.limitInCents)}`
                      : `${formatCurrency(b.limitInCents - b.spentInCents)} left`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    className="num"
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: b.isOver ? "var(--neg)" : "var(--ink)",
                    }}
                    aria-label={`Spent ${formatCurrency(b.spentInCents)} of ${formatCurrency(b.limitInCents)}`}
                  >
                    {formatCurrency(b.spentInCents)}
                  </div>
                  <div
                    className="num muted"
                    style={{ fontSize: 11 }}
                  >
                    of {formatCurrency(b.limitInCents)}
                  </div>
                </div>
              </div>
              <div
                className="bar"
                style={{ marginTop: 12 }}
                role="progressbar"
                aria-valuenow={Math.min(b.percentageUsed, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${b.name}: ${formatPercent(b.percentageUsed)} used`}
              >
                <i
                  style={{
                    background: b.isOver ? "var(--neg)" : b.color,
                    transform: `scaleX(${Math.min(b.percentageUsed, 100) / 100})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Daily spend heatmap */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div className="sec-label">Daily spend · April</div>
              <span className="pill">23 days</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
              aria-label="Daily spending heatmap"
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 9.5,
                    color: "var(--ink-4)",
                    textAlign: "center",
                    fontFamily: "var(--f-mono)",
                    marginBottom: 2,
                  }}
                  aria-hidden
                >
                  {d}
                </div>
              ))}
              {dailySpendHistory.slice(0, 30).map((v, i) => {
                const max = Math.max(...dailySpendHistory);
                const intensity = max > 0 ? v / max : 0;
                const today = i === 22;
                const bg =
                  intensity > 0.75
                    ? heatmapIntensityColors[4]
                    : intensity > 0.55
                      ? heatmapIntensityColors[3]
                      : intensity > 0.3
                        ? heatmapIntensityColors[2]
                        : intensity > 0.1
                          ? heatmapIntensityColors[1]
                          : heatmapIntensityColors[0];
                return (
                  <div
                    key={i}
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: bg,
                      color:
                        intensity > 0.55 || today
                          ? "white"
                          : "var(--ink-2)",
                      borderRadius: 5,
                      fontFamily: "var(--f-mono)",
                      fontSize: 10,
                      border: today ? "1.5px solid var(--ink)" : "none",
                      fontWeight: today ? 700 : 400,
                    }}
                    aria-label={`Day ${i + 1}`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 14,
                fontSize: 10,
                color: "var(--ink-4)",
              }}
              aria-label="Heatmap legend: less to more spending"
            >
              <span>less</span>
              {(["#fbf7ee", "#f5edd9", "#ecdfc0", "#d9c098", "#c96442"] as const).map(
                (c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      background: c,
                      borderRadius: 3,
                    }}
                    aria-hidden
                  />
                )
              )}
              <span>more</span>
            </div>
          </div>

          {/* AI Suggestion */}
          <div
            className="card"
            style={{
              padding: 18,
              borderColor: "var(--accent-soft)",
              background: "var(--accent-tint)",
            }}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: "var(--accent)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-hidden
              >
                <Icon name="sparkle" size={13} stroke={2} />
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent-2)",
                  alignSelf: "center",
                }}
              >
                Suggestion
              </div>
            </div>
            <div
              style={{
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "var(--ink-2)",
              }}
            >
              Based on your last 3 months, your dining budget should be{" "}
              <span style={{ color: "var(--accent-2)", fontWeight: 600 }}>
                $270
              </span>{" "}
              — not $200.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-sm btn-accent" type="button">
                Update budget
              </button>
              <button className="btn btn-sm btn-ghost" type="button">
                Dismiss
              </button>
            </div>
          </div>

          {/* vs last month */}
          <div className="card" style={{ padding: 20 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>
              vs last month
            </div>
            {vsLastMonth.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderTop: i > 0 ? "1px solid var(--border-2)" : "none",
                }}
              >
                <span style={{ fontSize: 12.5 }}>{item.category}</span>
                <span
                  className="num"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color:
                      item.tone === "pos" ? "var(--pos)" : "var(--neg)",
                  }}
                >
                  {item.deltaInCents > 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(item.deltaInCents))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
