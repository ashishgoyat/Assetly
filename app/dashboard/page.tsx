import { auth } from "@/auth";
import { cookies } from "next/headers";
import CashOnHandCard from "@/app/components/dashboard/CashOnHandCard";
import DashboardActivity from "@/app/components/dashboard/DashboardActivity";
import { formatCurrency } from "@/lib/format";
import { getCurrencyServer, getExchangeRateServer } from "@/lib/server-prefs";
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
  const currency = await getCurrencyServer();
  const [session, cookieStore, rate] = await Promise.all([
    auth(),
    cookies(),
    getExchangeRateServer(currency),
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
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0, fontWeight: 700 }}
        >
          {greeting}, {displayName}.
        </h1>
      </div>

      {/* Row 1: Net worth chart + Safe-to-spend */}
      <div className="grid-2col-wide" style={{ marginBottom: 14 }}>
        {/* Net worth / Cash flow — dark card */}
        <CashOnHandCard
          dark={true}
          totalInCents={cashTotalInCents}
          weekDeltaInCents={cashWeekDeltaInCents}
          cashFlowDataByPeriod={cashFlowDataByPeriod}
          cashFlowLabelsByPeriod={cashFlowLabelsByPeriod}
          accounts={acctList.map((a) => ({
            name: a.name,
            color: a.color,
            balanceInCents: a.balanceInCents,
          }))}
        />

        {/* Safe to spend */}
        <div
          className="card"
          style={{ padding: 22, position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div className="sec-label">
              Safe to spend today
            </div>
          </div>
          <div
            className="num"
            style={{
              fontSize: "clamp(2rem, 6vw, 4.5rem)",
              lineHeight: 1,
              marginTop: 14,
              color: "var(--ink)",
              letterSpacing: "-0.04em",
              fontWeight: 700,
            }}
          >
            {formatCurrency(safeToSpendInCents, currency, rate)}
          </div>
          <div style={{ marginTop: 14, color: "var(--ink-2)" }}>
            <span className="num" style={{ fontWeight: 500 }}>
              {formatCurrency(spentTodayInCents, currency, rate)}
            </span>{" "}
            <span style={{ color: "var(--ink-3)" }}>
              of {formatCurrency(dailyAllowanceInCents, currency, rate)} daily allowance
            </span>
          </div>
          <div
            className="bar"
            style={{ marginTop: 8, background: "var(--border)" }}
          >
            <i
              style={{
                background: "var(--pos)",
                transform: `scaleX(${pctToday / 100})`,
              }}
            />
          </div>
        </div>
      </div>

      <DashboardActivity
        initialBills={upcomingBills}
        initialTransactions={recentTransactions}
        initialGoals={savingGoals}
      />
    </div>
  );
}
