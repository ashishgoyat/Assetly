/**
 * Dashboard / Home page — Server Component
 */

import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import MerchantIcon from "@/app/components/ui/MerchantIcon";
import AreaChart from "@/app/components/charts/AreaChart";
import DonutChart from "@/app/components/charts/DonutChart";
import PeriodSelector from "@/app/components/ui/PeriodSelector";
import type { DashboardSummary } from "@/contracts/api-contracts";
import { MOCK_DASHBOARD } from "@/lib/mock-data";
import { formatCurrency, formatCompact } from "@/lib/format";

async function getDashboardData(): Promise<DashboardSummary> {
  try {
    // TODO: awaiting backend — expects GET /api/dashboard, see contracts/api-contracts.ts
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/dashboard`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as DashboardSummary;
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.error("[dashboard] API not available, using mock data:", err);
    return MOCK_DASHBOARD;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { user, today, cashOnHand, actions, recentTransactions, upcomingBills, savingGoals, spendingCategories, totalSpentThisMonthInCents } = data;

  const pctToday = today.percentSpentToday;

  return (
    <div className="page-content">
      {/* Greeting */}
      <div style={{ marginBottom: 22 }}>
        <div className="sec-label" style={{ marginBottom: 6 }}>{today.date}</div>
        <h1
          className="serif"
          style={{ fontSize: 40, lineHeight: 1.02, letterSpacing: "-0.02em", margin: 0 }}
        >
          Morning, {user.name}.{" "}
          <span style={{ color: "var(--ink-3)" }}>
            {actions.length} things need your attention.
          </span>
        </h1>
      </div>

      {/* Action queue */}
      <div
        className="grid-3col"
        style={{ marginBottom: 22 }}
      >
        {actions.map((a, i) => (
          <ActionCard key={i} action={a} />
        ))}
      </div>

      {/* Row 1: Safe-to-spend + Cash flow */}
      <div
        className="grid-2col-wide"
        style={{ marginBottom: 14 }}
      >
        {/* Safe to spend */}
        <div
          className="card-accent"
          style={{ padding: 22, position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              className="sec-label"
              style={{ color: "var(--accent-2)" }}
            >
              Safe to spend today
            </div>
            <span className="pill pill-accent">After bills · savings</span>
          </div>
          <div
            className="serif num"
            style={{
              fontSize: 92,
              lineHeight: 1,
              marginTop: 14,
              color: "var(--accent-2)",
              letterSpacing: "-0.04em",
            }}
          >
            {formatCurrency(today.safeToSpendInCents)}
          </div>
          <div style={{ marginTop: 14, color: "var(--ink-2)" }}>
            <span className="num" style={{ fontWeight: 500 }}>
              {formatCurrency(today.spentTodayInCents)}
            </span>{" "}
            <span className="muted">
              of {formatCurrency(today.dailyAllowanceInCents)} daily allowance
            </span>
          </div>
          <div
            className="bar"
            style={{ marginTop: 8, background: "var(--accent-soft)" }}
          >
            <i
              style={{
                background: "var(--accent)",
                transform: `scaleX(${pctToday / 100})`,
              }}
            />
          </div>
          {/* Decorative circle */}
          <div
            style={{
              position: "absolute",
              right: -28,
              bottom: -28,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.06,
            }}
            aria-hidden
          />
        </div>

        {/* Cash flow */}
        <div className="card" style={{ padding: 22, position: "relative" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div className="sec-label">Cash on hand</div>
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
                  {formatCompact(cashOnHand.totalInCents)}
                </span>
                <span className="pill pill-pos">
                  <Icon name="arrowUp" size={11} />
                  {formatCompact(cashOnHand.weekDeltaInCents)} this week
                </span>
              </div>
            </div>
            <PeriodSelector periods={["1W", "1M", "3M", "1Y"]} defaultIndex={1} />
          </div>
          <div style={{ marginTop: 14 }}>
            <AreaChart data={cashOnHand.cashFlowData} h={150} color="var(--accent)" />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--f-mono)",
              fontSize: 10.5,
              color: "var(--ink-4)",
              marginTop: 4,
              padding: "0 4px",
            }}
          >
            <span>Apr 1</span>
            <span>Apr 8</span>
            <span>Apr 15</span>
            <span>Apr 22</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Row 2: Upcoming bills + Recent activity */}
      <div
        className="grid-2col-bills"
        style={{ marginBottom: 14 }}
      >
        {/* Upcoming bills */}
        <div className="card" style={{ padding: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Upcoming bills
            </h2>
            <Link href="/dashboard/bills" className="btn btn-sm btn-ghost">
              See all <Icon name="chev" size={11} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {upcomingBills.map((b) => (
              <div
                key={b.id}
                className="tx-row"
                style={{ gridTemplateColumns: "44px 1fr auto" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: b.isUrgent ? "var(--accent)" : "var(--bg-soft)",
                    color: b.isUrgent ? "white" : "var(--ink-2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  aria-label={b.dueDate}
                >
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      opacity: 0.85,
                    }}
                  >
                    {b.dueDate.split(" ")[0]}
                  </span>
                  <span
                    className="num"
                    style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}
                  >
                    {b.dueDate.split(" ")[1]}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{b.name}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 2,
                    }}
                  >
                    {b.isAutoPay ? (
                      <>
                        <Icon name="check" size={10} color="var(--pos)" />
                        Auto-pay
                      </>
                    ) : (
                      <span style={{ color: "var(--accent-2)" }}>
                        Needs scheduling
                      </span>
                    )}
                    <span className="dim">·</span>
                    <span>
                      in {b.dueInDays} {b.dueInDays === 1 ? "day" : "days"}
                    </span>
                  </div>
                </div>
                <div className="num" style={{ fontSize: 15, fontWeight: 600 }}>
                  {formatCurrency(b.amountInCents)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card" style={{ padding: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Recent activity
            </h2>
            <Link
              href="/dashboard/transactions"
              className="btn btn-sm btn-ghost"
            >
              All transactions <Icon name="chev" size={11} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentTransactions.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                href="/dashboard/transactions"
                className="tx-row"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <MerchantIcon name={r.merchant} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {r.merchant}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: "var(--ink-3)" }}
                  >
                    {r.category} · {r.date}, {r.time}
                  </div>
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      r.type === "income" ? "var(--pos)" : "var(--ink)",
                  }}
                >
                  {r.type === "income" ? "+" : "−"}
                  {formatCurrency(r.amountInCents)}
                </div>
                <Icon name="chev" size={14} color="var(--ink-4)" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Saving goals + Where it went */}
      <div className="grid-2col-goals">
        {/* Goals */}
        <div className="card" style={{ padding: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Saving goals
              </h2>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                {formatCompact(
                  savingGoals.reduce((s, g) => s + g.currentInCents, 0)
                )}{" "}
                saved
              </div>
            </div>
            <Link href="/dashboard/goals" className="btn btn-sm btn-ghost">
              See all <Icon name="chev" size={11} />
            </Link>
          </div>
          <div className="grid-3col" style={{ gap: 12 }}>
            {savingGoals.map((g) => (
              <div key={g.id} className="card-flat" style={{ padding: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>
                  {g.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    marginBottom: 8,
                  }}
                >
                  <span
                    className="num serif"
                    style={{ fontSize: 22, lineHeight: 1 }}
                  >
                    {formatCompact(g.currentInCents)}
                  </span>
                  <span
                    className="num"
                    style={{ fontSize: 11, color: "var(--ink-3)" }}
                  >
                    / {formatCompact(g.targetInCents)}
                  </span>
                </div>
                <div className="bar">
                  <i
                    style={{
                      transform: `scaleX(${g.percentageComplete / 100})`,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--accent-2)", fontWeight: 600 }}>
                    {g.percentageComplete}%
                  </span>
                  <span style={{ color: "var(--ink-3)" }}>ETA {g.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Where it went */}
        <div className="card" style={{ padding: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Where it went
            </h2>
            <Link
              href="/dashboard/insights"
              className="btn btn-icon btn-ghost"
              aria-label="View insights"
            >
              <Icon name="dots" size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <DonutChart
              size={120}
              strokeW={16}
              label={formatCompact(totalSpentThisMonthInCents)}
              sub="this month"
              segs={spendingCategories.map((c) => ({
                v: c.amountInCents,
                c: c.color,
                label: c.name,
              }))}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              {spendingCategories.map((c, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    className="dot"
                    style={{ background: c.color }}
                    aria-hidden
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: "var(--ink-2)",
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="num"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {formatCompact(c.amountInCents)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionCard — inline server component
// ---------------------------------------------------------------------------

interface ActionItem {
  type: "bill" | "insight" | "todo";
  title: string;
  sub: string;
  cta: string;
  tone: "accent" | "warn" | "primary";
  route?: string;
}

function ActionCard({ action: a }: { action: ActionItem }) {
  const isAccent = a.tone === "accent";
  const isWarn = a.tone === "warn";
  const isPrimary = a.tone === "primary";

  const iconName =
    a.type === "bill" ? "bill" : a.type === "insight" ? "sparkle" : "check";

  // When the card has a route, the whole card is a link — render the CTA as a
  // styled span to avoid nesting interactive elements (invalid HTML).
  const ctaEl = a.route ? (
    <span className={`btn btn-sm${isPrimary ? " btn-primary" : ""}`}>
      {a.cta}
    </span>
  ) : (
    <button
      className={`btn btn-sm${isPrimary ? " btn-primary" : ""}`}
      type="button"
    >
      {a.cta}
    </button>
  );

  const content = (
    <div
      className="card"
      style={{
        padding: 18,
        position: "relative",
        overflow: "hidden",
        borderColor: isAccent
          ? "var(--accent-soft)"
          : isWarn
            ? "var(--warn-soft)"
            : "var(--border)",
        background: isAccent
          ? "linear-gradient(180deg, var(--accent-tint), var(--surface) 80%)"
          : isWarn
            ? "linear-gradient(180deg, var(--warn-soft) 0%, var(--surface) 80%)"
            : "var(--surface)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isAccent
              ? "var(--accent)"
              : isWarn
                ? "var(--warn)"
                : "var(--ink)",
            color: "white",
          }}
          aria-hidden
        >
          <Icon name={iconName} size={13} stroke={2} />
        </div>
        <div
          className="sec-label"
          style={{
            color: isAccent
              ? "var(--accent-2)"
              : isWarn
                ? "var(--warn)"
                : "var(--ink-3)",
          }}
        >
          {a.type === "bill"
            ? "Due soon"
            : a.type === "insight"
              ? "Insight"
              : "To do"}
        </div>
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1.25,
          marginBottom: 4,
        }}
      >
        {a.title}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--ink-3)",
          marginBottom: 14,
          lineHeight: 1.4,
        }}
      >
        {a.sub}
      </div>
      {ctaEl}
    </div>
  );

  return a.route ? (
    <Link href={a.route} style={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </Link>
  ) : (
    content
  );
}
