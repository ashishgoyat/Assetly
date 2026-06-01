/**
 * Dashboard / Home page — Server Component
 */

import Link from "next/link";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import Icon from "@/app/components/ui/Icon";
import DonutChart from "@/app/components/charts/DonutChart";
import CashOnHandCard from "@/app/components/dashboard/CashOnHandCard";
import BillRow from "@/app/components/dashboard/BillRow";
import TransactionRow from "@/app/components/dashboard/TransactionRow";
import GoalCard from "@/app/components/dashboard/GoalCard";
import type { DashboardSummary } from "@/contracts/api-contracts";
import { MOCK_DASHBOARD } from "@/lib/mock-data";
import { formatCurrency, formatCompact } from "@/lib/format";

function getHourInTimezone(timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    return Number.isNaN(h) ? new Date().getHours() : h % 24;
  } catch {
    return new Date().getHours();
  }
}

function getGreeting(hour: number): string {
  if (hour < 5) return "Late night";
  if (hour < 7) return "Early morning";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Late night";
}

function firstName(full: string | null | undefined): string {
  if (!full) return "there";
  const trimmed = full.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

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
  const [data, session, cookieStore] = await Promise.all([
    getDashboardData(),
    auth(),
    cookies(),
  ]);
  const { user, today, cashOnHand, actions, recentTransactions, upcomingBills, savingGoals, spendingCategories, totalSpentThisMonthInCents } = data;

  const displayName = firstName(session?.user?.name ?? user.name);
  const timezone = cookieStore.get("assetly-timezone")?.value ?? "Asia/Kolkata";
  const greeting = getGreeting(getHourInTimezone(timezone));

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
          {greeting}, {displayName}.{" "}
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
        <CashOnHandCard
          totalInCents={cashOnHand.totalInCents}
          weekDeltaInCents={cashOnHand.weekDeltaInCents}
          cashFlowDataByPeriod={cashOnHand.cashFlowDataByPeriod}
          cashFlowLabelsByPeriod={cashOnHand.cashFlowLabelsByPeriod}
        />
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
              <BillRow key={b.id} bill={b} />
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
              <TransactionRow key={r.id} tx={r} />
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
              <GoalCard key={g.id} goal={g} />
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
  const isBill = a.type === "bill";

  const iconName =
    a.type === "bill" ? "bill" : a.type === "insight" ? "sparkle" : "check";

  // Bill cards: the whole card is the link to /dashboard/bills, no CTA button.
  // Other cards (insight, todo): keep their CTA.
  const ctaEl = isBill
    ? null
    : a.route
      ? (
          <span className={`btn btn-sm${isPrimary ? " btn-primary" : ""}`}>
            {a.cta}
          </span>
        )
      : (
          <button
            className={`btn btn-sm${isPrimary ? " btn-primary" : ""}`}
            type="button"
          >
            {a.cta}
          </button>
        );

  const content = (
    <div
      className={`card${a.route ? " card-hoverable" : ""}`}
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
          marginBottom: ctaEl ? 14 : 0,
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
