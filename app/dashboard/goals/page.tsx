/**
 * Goals page — Server Component
 */

import Icon from "@/app/components/ui/Icon";
import type { GoalSummary } from "@/contracts/api-contracts";
import { MOCK_GOALS } from "@/lib/mock-data";
import { formatCurrency, formatCompact, formatPercent } from "@/lib/format";
import NewGoalButton from "@/app/dashboard/goals/NewGoalButton";

async function getGoalsData(): Promise<GoalSummary> {
  try {
    // TODO: awaiting backend — expects GET /api/goals, see contracts/api-contracts.ts
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/goals`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as GoalSummary;
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.error("[goals] API not available, using mock data:", err);
    return MOCK_GOALS;
  }
}

export default async function GoalsPage() {
  const data = await getGoalsData();
  const {
    totalSavedInCents,
    totalTargetInCents,
    totalMonthlyContributionInCents,
    savingsRatePercent,
    savingsRateDeltaPoints,
    activeTransfers,
    goals,
  } = data;

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
            Goals
          </h1>
          <div className="muted" style={{ marginTop: 4 }}>
            {formatCompact(totalSavedInCents)} saved across {goals.length}{" "}
            goals
          </div>
        </div>
        <NewGoalButton />
      </div>

      {/* Hero strip */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="grid-3col"
          style={{ gap: 32, alignItems: "center" }}
        >
          <div>
            <div className="sec-label">Total saved</div>
            <div
              className="serif num"
              style={{ fontSize: 54, lineHeight: 1, marginTop: 8 }}
            >
              {formatCompact(totalSavedInCents)}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              of{" "}
              <span className="num">
                {formatCompact(totalTargetInCents)}
              </span>{" "}
              ·{" "}
              {formatPercent(
                Math.round((totalSavedInCents / totalTargetInCents) * 100)
              )}{" "}
              there
            </div>
          </div>
          <div>
            <div className="sec-label">Auto-saving</div>
            <div
              className="serif num"
              style={{
                fontSize: 36,
                lineHeight: 1,
                marginTop: 8,
                color: "var(--pos)",
              }}
            >
              {formatCurrency(totalMonthlyContributionInCents)}
              <span style={{ fontSize: 16, color: "var(--ink-3)" }}>/mo</span>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {activeTransfers} active transfers
            </div>
          </div>
          <div>
            <div className="sec-label">Savings rate</div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                marginTop: 8,
              }}
            >
              <span className="serif num" style={{ fontSize: 36, lineHeight: 1 }}>
                {savingsRatePercent}%
              </span>
              <span className="pill pill-pos" style={{ marginBottom: 4 }}>
                <Icon name="arrowUp" size={10} /> +{savingsRateDeltaPoints}pts
              </span>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              up from {savingsRatePercent - savingsRateDeltaPoints}% last month
            </div>
          </div>
        </div>
      </div>

      {/* Goal cards */}
      <div className="grid-2col">
        {goals.map((g) => (
          <article
            key={g.id}
            className="card"
            style={{ padding: 22, position: "relative", overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: g.color + "20",
                  color: g.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-hidden
              >
                <Icon name={g.icon as "lock"} size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {g.name}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {g.vibe} · {formatCurrency(g.monthlyContributionInCents)}/mo auto
                </div>
              </div>
              <button
                className="btn btn-icon btn-ghost"
                aria-label={`Options for ${g.name}`}
                type="button"
              >
                <Icon name="dots" size={16} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div>
                <span
                  className="serif num"
                  style={{ fontSize: 32 }}
                >
                  {formatCompact(g.currentInCents)}
                </span>
                <span className="muted" style={{ marginLeft: 4 }}>
                  of {formatCompact(g.targetInCents)}
                </span>
              </div>
              <span
                className="num serif"
                style={{
                  fontSize: 28,
                  color: g.color,
                  fontWeight: 500,
                }}
              >
                {g.percentageComplete}%
              </span>
            </div>

            <div
              className="bar lg"
              role="progressbar"
              aria-valuenow={g.percentageComplete}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${g.name}: ${g.percentageComplete}% complete`}
            >
              <i
                style={{
                  background: g.color,
                  transform: `scaleX(${g.percentageComplete / 100})`,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 14,
                fontSize: 12,
              }}
            >
              <span style={{ color: "var(--ink-3)" }}>
                ETA ·{" "}
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                  {g.eta}
                </span>
              </span>
              <span style={{ color: "var(--ink-3)" }}>
                <span
                  className="num"
                  style={{ fontWeight: 600, color: "var(--ink-2)" }}
                >
                  {formatCompact(g.targetInCents - g.currentInCents)}
                </span>{" "}
                to go
              </span>
            </div>
          </article>
        ))}

        {/* Add new goal */}
        <NewGoalButton variant="dashed" />
      </div>
    </div>
  );
}
