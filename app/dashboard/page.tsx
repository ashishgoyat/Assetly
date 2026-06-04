/**
 * Dashboard / Home page — Server Component
 */

import { auth } from "@/auth";
import { cookies } from "next/headers";
import CashOnHandCard from "@/app/components/dashboard/CashOnHandCard";
import DashboardActivity from "@/app/components/dashboard/DashboardActivity";
import type { DashboardSummary } from "@/contracts/api-contracts";
import { MOCK_DASHBOARD } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { getCurrencyServer } from "@/lib/server-prefs";

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
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    const vercelUrl = process.env.VERCEL_URL
    const base = process.env.NEXT_PUBLIC_BASE_URL
      ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")
    const res = await fetch(`${base}/api/dashboard`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });
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
  const [data, session, cookieStore, currency] = await Promise.all([
    getDashboardData(),
    auth(),
    cookies(),
    getCurrencyServer(),
  ]);
  const { user, today, cashOnHand, recentTransactions, upcomingBills, savingGoals } = data;

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
          {greeting}, {displayName}.
        </h1>
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
            {formatCurrency(today.safeToSpendInCents, currency)}
          </div>
          <div style={{ marginTop: 14, color: "var(--ink-2)" }}>
            <span className="num" style={{ fontWeight: 500 }}>
              {formatCurrency(today.spentTodayInCents, currency)}
            </span>{" "}
            <span className="muted">
              of {formatCurrency(today.dailyAllowanceInCents, currency)} daily allowance
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

      <DashboardActivity
        initialBills={upcomingBills}
        initialTransactions={recentTransactions}
        initialGoals={savingGoals}
      />
    </div>
  );
}

