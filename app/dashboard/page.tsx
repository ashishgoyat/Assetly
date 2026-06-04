import { auth } from "@/auth";
import { cookies } from "next/headers";
import CashOnHandCard from "@/app/components/dashboard/CashOnHandCard";
import DashboardActivity from "@/app/components/dashboard/DashboardActivity";
import { formatCurrency } from "@/lib/format";
import { getCurrencyServer } from "@/lib/server-prefs";
import {
  getTransactions,
  getAccounts,
  getBills,
  getGoals,
  getBudgets,
} from "@/lib/data/store";
import {
  getLatestTransactionDate,
  parseDate,
  daysInMonth,
  formatDateLong,
} from "@/lib/calculations";
import { computeCashFlow } from "@/lib/cash-flow";

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

export default async function DashboardPage() {
  const [session, cookieStore, currency] = await Promise.all([
    auth(),
    cookies(),
    getCurrencyServer(),
  ]);

  const userId = (session?.user as { id?: string })?.id ?? "";

  const [txList, acctList, billList, goalList, budgetList] = await Promise.all([
    getTransactions(userId),
    getAccounts(userId),
    getBills(userId),
    getGoals(userId),
    getBudgets(userId),
  ]);

  const latestDate =
    getLatestTransactionDate(txList) || new Date().toISOString().slice(0, 10);
  const { year, month } = parseDate(latestDate);

  const cashAccounts = acctList.filter((a) => a.type !== "investment");
  const cashTotalInCents = cashAccounts.reduce((s, a) => s + a.balanceInCents, 0);
  const cashWeekDeltaInCents = cashAccounts.reduce((s, a) => s + a.weekDeltaInCents, 0);

  const { dataByPeriod: cashFlowDataByPeriod, labelsByPeriod: cashFlowLabelsByPeriod } =
    computeCashFlow(txList, cashTotalInCents, new Date());

  const spentTodayInCents = txList
    .filter((tx) => tx.date === latestDate && tx.type === "expense")
    .reduce((s, tx) => s + tx.amountInCents, 0);

  const totalBudgetLimitInCents = budgetList.reduce((s, b) => s + b.limitInCents, 0);
  const daysInCurrentMonth = daysInMonth(year, month);
  const dailyAllowanceInCents = Math.round(totalBudgetLimitInCents / daysInCurrentMonth);
  const safeToSpendInCents = Math.max(0, dailyAllowanceInCents - spentTodayInCents);
  const percentSpentToday =
    dailyAllowanceInCents > 0
      ? Math.round((spentTodayInCents / dailyAllowanceInCents) * 100)
      : 0;

  const recentTransactions = txList.slice(0, 7);
  const upcomingBills = [...billList].sort((a, b) => a.dueInDays - b.dueInDays).slice(0, 4);
  const savingGoals = goalList.slice(0, 3);

  const displayName = firstName(session?.user?.name);
  const timezone = cookieStore.get("assetly-timezone")?.value ?? "Asia/Kolkata";
  const greeting = getGreeting(getHourInTimezone(timezone));
  const pctToday = percentSpentToday;

  return (
    <div className="page-content">
      {/* Greeting */}
      <div style={{ marginBottom: 22 }}>
        <div className="sec-label" style={{ marginBottom: 6 }}>
          {formatDateLong(latestDate)}
        </div>
        <h1
          className="serif"
          style={{ fontSize: 40, lineHeight: 1.02, letterSpacing: "-0.02em", margin: 0 }}
        >
          {greeting}, {displayName}.
        </h1>
      </div>

      {/* Row 1: Safe-to-spend + Cash flow */}
      <div className="grid-2col-wide" style={{ marginBottom: 14 }}>
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
            <div className="sec-label" style={{ color: "var(--accent-2)" }}>
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
            {formatCurrency(safeToSpendInCents, currency)}
          </div>
          <div style={{ marginTop: 14, color: "var(--ink-2)" }}>
            <span className="num" style={{ fontWeight: 500 }}>
              {formatCurrency(spentTodayInCents, currency)}
            </span>{" "}
            <span className="muted">
              of {formatCurrency(dailyAllowanceInCents, currency)} daily allowance
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
          totalInCents={cashTotalInCents}
          weekDeltaInCents={cashWeekDeltaInCents}
          cashFlowDataByPeriod={cashFlowDataByPeriod}
          cashFlowLabelsByPeriod={cashFlowLabelsByPeriod}
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
