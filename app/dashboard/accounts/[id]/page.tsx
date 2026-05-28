/**
 * Account detail page — Server Component
 * Dynamic route: /dashboard/accounts/[id]
 */

import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import MerchantIcon from "@/app/components/ui/MerchantIcon";
import AreaChart from "@/app/components/charts/AreaChart";
import PeriodSelector from "@/app/components/ui/PeriodSelector";
import type { AccountDetail } from "@/contracts/api-contracts";
import { MOCK_ACCOUNT_DETAILS } from "@/lib/mock-data";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";

interface AccountPageProps {
  params: Promise<{ id: string }>;
}

async function getAccountData(id: string): Promise<AccountDetail | null> {
  try {
    // TODO: awaiting backend — expects GET /api/accounts/[id], see contracts/api-contracts.ts
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/accounts/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as AccountDetail;
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.error("[account] API not available, using mock data:", err);
    return MOCK_ACCOUNT_DETAILS[id] ?? null;
  }
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { id } = await params;
  const detail = await getAccountData(id);

  if (!detail) {
    return (
      <div
        style={{
          padding: "8px 28px 36px",
          textAlign: "center",
          paddingTop: 60,
        }}
      >
        <Icon name="bank" size={48} color="var(--ink-4)" />
        <div
          style={{ fontSize: 18, fontWeight: 600, marginTop: 16, marginBottom: 8 }}
        >
          Account not found
        </div>
        <div className="muted" style={{ marginBottom: 24 }}>
          The account &ldquo;{id}&rdquo; doesn&apos;t exist or hasn&apos;t been linked yet.
        </div>
        <Link href="/dashboard" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { account: a, recentTransactions, monthlySummary } = detail;

  const accountTypeLabelMap: Record<string, string> = {
    checking: "Checking",
    savings: `Savings${a.apyBps ? ` · ${(a.apyBps / 100).toFixed(2)}% APY` : ""}`,
    investment: "Investment",
  };
  const typeLabel = accountTypeLabelMap[a.type] ?? a.type;

  return (
    <div style={{ padding: "8px 28px 36px" }}>
      {/* Back button */}
      <Link
        href="/dashboard"
        className="btn btn-sm btn-ghost"
        style={{ marginBottom: 14, display: "inline-flex" }}
        aria-label="Back to home"
      >
        <span
          style={{
            display: "inline-flex",
            transform: "rotate(180deg)",
            transformOrigin: "center",
          }}
          aria-hidden
        >
          <Icon name="chev" size={12} />
        </span>
        Home
      </Link>

      {/* Account header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: a.color + "20",
              color: a.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-hidden
          >
            <Icon name="bank" size={24} stroke={1.7} />
          </div>
          <div>
            <h1
              className="serif"
              style={{ fontSize: 32, margin: 0, lineHeight: 1.05 }}
            >
              {a.name}
            </h1>
            <div className="muted" style={{ marginTop: 4 }}>
              {typeLabel} · {a.number} · synced {a.lastSync}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" type="button">
            <Icon name="refresh" size={13} /> Sync
          </button>
          <button className="btn btn-sm" type="button">
            Settings
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 14,
        }}
      >
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Balance + chart */}
          <div className="card" style={{ padding: 28 }}>
            <div className="sec-label">Current balance</div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginTop: 8,
              }}
            >
              <span
                className="serif num"
                style={{ fontSize: 52, lineHeight: 1 }}
              >
                {formatCurrencyExact(a.balanceInCents)}
              </span>
              <span className="pill pill-pos">
                <Icon name="arrowUp" size={11} />
                {formatCurrency(a.weekDeltaInCents)} this week
              </span>
            </div>
            <div style={{ marginTop: 18 }}>
              <AreaChart
                data={a.balanceHistory}
                h={160}
                color={a.color}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <PeriodSelector periods={["1W", "1M", "3M", "6M", "1Y", "All"]} defaultIndex={1} />
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  fontSize: 11,
                  color: "var(--ink-3)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Low{" "}
                  <span className="num" style={{ color: "var(--ink-2)" }}>
                    {formatCurrency(Math.min(...a.balanceHistory))}
                  </span>
                </span>
                <span className="dim">·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  High{" "}
                  <span className="num" style={{ color: "var(--ink-2)" }}>
                    {formatCurrency(Math.max(...a.balanceHistory))}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="card" style={{ padding: 8 }}>
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid var(--border-2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Activity</div>
              <Link
                href="/dashboard/transactions"
                className="btn btn-sm btn-ghost"
              >
                All transactions <Icon name="chev" size={11} />
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--ink-3)",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  No transactions
                </div>
                <div style={{ fontSize: 12 }}>
                  No recent activity for this account.
                </div>
              </div>
            ) : (
              recentTransactions.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className="tx-row"
                  style={{
                    gridTemplateColumns: "32px 1fr 100px auto 20px",
                  }}
                >
                  <MerchantIcon name={r.merchant} size={32} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {r.merchant}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                      {r.category}
                    </div>
                  </div>
                  <div
                    className="muted"
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--f-mono)",
                    }}
                  >
                    {r.date}
                  </div>
                  <div
                    className="num"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      textAlign: "right",
                      color:
                        r.type === "income" ? "var(--pos)" : "var(--ink)",
                    }}
                  >
                    {r.type === "income" ? "+" : "−"}
                    {formatCurrencyExact(r.amountInCents)}
                  </div>
                  <Icon name="chev" size={13} color="var(--ink-4)" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* This month */}
          <div className="card" style={{ padding: 20 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>
              This month
            </div>
            {(
              [
                ["Money in",  formatCurrencyExact(monthlySummary.moneyInInCents),   "pos"],
                ["Money out", `−${formatCurrencyExact(monthlySummary.moneyOutInCents)}`, undefined],
                ["Fees",      monthlySummary.feesInCents === 0 ? "$0" : formatCurrencyExact(monthlySummary.feesInCents), "muted"],
                ["Interest",  monthlySummary.interestInCents > 0 ? `+${formatCurrencyExact(monthlySummary.interestInCents)}` : "$0", monthlySummary.interestInCents > 0 ? "pos" : undefined],
              ] as [string, string, string | undefined][]
            ).map(([label, value, tone], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderTop: i > 0 ? "1px solid var(--border-2)" : "none",
                }}
              >
                <span style={{ fontSize: 12.5 }}>{label}</span>
                <span
                  className="num"
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color:
                      tone === "pos"
                        ? "var(--pos)"
                        : tone === "muted"
                          ? "var(--ink-4)"
                          : undefined,
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Account details */}
          <div className="card" style={{ padding: 20 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>
              Details
            </div>
            {(
              [
                ["Account", a.name, false],
                ["Number",  a.number, true],
                ["Routing", a.routingNumber ?? "—", true],
                ["Type",    typeLabel, false],
                ["Status",  "Active", false],
                ["Linked",  a.linkedSince, false],
              ] as [string, string, boolean][]
            ).map(([label, value, mono], i) => (
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
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {label}
                </span>
                {label === "Status" ? (
                  <span className="pill pill-pos">
                    <span
                      className="dot"
                      style={{ background: "var(--pos)" }}
                      aria-hidden
                    />{" "}
                    {value}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 12.5,
                      fontFamily: mono ? "var(--f-mono)" : "inherit",
                    }}
                  >
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: 14 }}>
            <div className="sec-label" style={{ marginBottom: 10 }}>
              Quick actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "flex-start" }}
                type="button"
              >
                <Icon name="arrowR" size={14} /> Transfer money
              </button>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "flex-start" }}
                type="button"
              >
                <Icon name="spark" size={14} /> Set up auto-save
              </button>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "flex-start" }}
                type="button"
              >
                <Icon name="download" size={14} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
