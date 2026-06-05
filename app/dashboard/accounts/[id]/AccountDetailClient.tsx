"use client";

/**
 * AccountDetailClient — Client Component
 * Owns period state, fetches /api/accounts/[id]?period=... on mount and on
 * every period change, and renders the full account detail UI.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import MerchantIcon from "@/app/components/ui/MerchantIcon";
import AreaChart from "@/app/components/charts/AreaChart";
import PeriodSelector from "@/app/components/ui/PeriodSelector";
import type { AccountDetail, Account, Goal, Transaction } from "@/contracts/api-contracts";
import { MOCK_ACCOUNT_DETAILS } from "@/lib/mock-data";
import { useFormatCurrency } from "@/app/contexts/CurrencyContext";
import {
  syncAccountAction,
  transferMoneyAction,
  setupAutoSaveAction,
  updateAccountAction,
  deleteAccountAction,
  addFundsFromCashAction,
} from "@/app/dashboard/accounts/actions";

type Period = "1W" | "1M" | "3M" | "1Y";

const PERIODS: Period[] = ["1W", "1M", "3M", "1Y"];
const DEFAULT_PERIOD: Period = "1M";
const DEFAULT_PERIOD_INDEX = PERIODS.indexOf(DEFAULT_PERIOD);

interface AccountDetailClientProps {
  id: string;
}

export default function AccountDetailClient({ id }: AccountDetailClientProps) {
  const { fmt, fmtExact } = useFormatCurrency();
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // retrySignal increments when the user presses Retry, causing the effect to re-run
  const [retrySignal, setRetrySignal] = useState(0);

  // Sync state
  const [syncing, setSyncing] = useState(false);

  // Transfer modal state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [otherAccounts, setOtherAccounts] = useState<Account[]>([]);

  // Auto-save modal state
  const [autoSaveOpen, setAutoSaveOpen] = useState(false);
  const [autoSaveGoal, setAutoSaveGoal] = useState('');
  const [autoSaveAmount, setAutoSaveAmount] = useState('');
  const [autoSaveFreq, setAutoSaveFreq] = useState<'weekly' | 'monthly'>('monthly');
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [autoSaveSuccess, setAutoSaveSuccess] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Add funds from cash state
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsNote, setAddFundsNote] = useState('');
  const [addFundsPending, setAddFundsPending] = useState(false);
  const [addFundsError, setAddFundsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const base =
          "";
        const res = await fetch(
          `${base}/api/accounts/${id}?period=${period}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as
          | { data: AccountDetail; error: null }
          | { data: null; error: { message: string } };
        if (json.error) throw new Error(json.error.message);
        if (!cancelled) {
          setDetail(json.data);
          setSettingsName(json.data.account.name);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "production") {
          if (!cancelled)
            setError(err instanceof Error ? err.message : "Failed to load account");
          return;
        }
        // Development fallback: use mock data
        console.error("[account] API not available, using mock data:", err);
        const mock = MOCK_ACCOUNT_DETAILS[id] ?? null;
        if (!cancelled) {
          const resolved = mock ? { ...mock, period } : null;
          setDetail(resolved);
          if (resolved) setSettingsName(resolved.account.name);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => { cancelled = true; };
  }, [id, period, retrySignal]);

  // Fetch other accounts and goals once detail is loaded
  useEffect(() => {
    if (!detail) return;
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    fetch(`${base}/api/accounts`)
      .then(r => r.json())
      .then((d: { data?: Account[] }) => {
        if (d.data) {
          const others = d.data.filter((a: Account) => a.id !== detail.account.id);
          setOtherAccounts(others);
          setTransferTo(others[0]?.id ?? '');
        }
      })
      .catch(() => {});

    fetch(`${base}/api/goals`)
      .then(r => r.json())
      .then((d: { data?: { goals?: Goal[] } }) => {
        if (d.data?.goals) {
          setGoals(d.data.goals);
          setAutoSaveGoal(d.data.goals[0]?.id ?? '');
        }
      })
      .catch(() => {});
  }, [detail]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSync() {
    if (!detail) return;
    setSyncing(true);
    const result = await syncAccountAction(detail.account.id);
    if (result.success) {
      setDetail(prev => prev ? { ...prev, account: { ...prev.account, lastSync: 'Just now' } } : prev);
    }
    setSyncing(false);
  }

  async function handleTransfer() {
    if (!detail) return;
    setTransferring(true);
    setTransferError(null);
    const result = await transferMoneyAction({
      fromAccountId: detail.account.id,
      toAccountId: transferTo,
      amountDollars: transferAmount,
    });
    if (result.success) {
      setTransferOpen(false);
      setTransferAmount('');
      setTransferError(null);
      setRetrySignal(n => n + 1);
    } else {
      setTransferError(result.error);
    }
    setTransferring(false);
  }

  async function handleAutoSave() {
    if (!detail) return;
    setAutoSaving(true);
    setAutoSaveError(null);
    setAutoSaveSuccess(null);
    const result = await setupAutoSaveAction({
      accountId: detail.account.id,
      goalId: autoSaveGoal,
      amountDollars: autoSaveAmount,
      frequency: autoSaveFreq,
    });
    if (result.success) {
      setAutoSaveSuccess(`First transfer done. Next auto-save: ${result.nextDate}`);
      setAutoSaveAmount('');
      setRetrySignal(n => n + 1);
    } else {
      setAutoSaveError(result.error);
    }
    setAutoSaving(false);
  }

  async function handleSaveSettings() {
    if (!detail) return;
    setSavingSettings(true);
    setSettingsError(null);
    const fd = new FormData();
    fd.set('id', detail.account.id);
    fd.set('name', settingsName);
    fd.set('balanceDollars', String(detail.account.balanceInCents / 100));
    const result = await updateAccountAction(fd);
    if (result.success) {
      setSettingsOpen(false);
      setRetrySignal(n => n + 1);
    } else {
      setSettingsError(result.error);
    }
    setSavingSettings(false);
  }

  async function handleDeleteAccount() {
    if (!detail) return;
    if (!window.confirm(`Delete "${detail.account.name}"? This cannot be undone.`)) return;
    setDeletingAccount(true);
    const result = await deleteAccountAction(detail.account.id);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      alert(result.error);
      setDeletingAccount(false);
    }
  }

  async function handleExportCsv() {
    if (!detail) return;
    setExporting(true);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
      const res = await fetch(`${base}/api/transactions?pageSize=1000`);
      const json = (await res.json()) as { data?: { items?: { items?: Transaction[] } } };
      const allTxs: Transaction[] = json.data?.items?.items ?? [];
      const accountLabel = `${detail.account.name} ${detail.account.number}`;
      const accountTxs = allTxs.filter(t => t.accountLabel === accountLabel);

      const header = 'Date,Time,Merchant,Category,Type,Amount,Status';
      const lines = accountTxs.map(t =>
        [
          t.date, t.time,
          `"${t.merchant.replace(/"/g, '""')}"`,
          t.category, t.type,
          (t.amountInCents / 100).toFixed(2),
          t.status,
        ].join(',')
      );
      const csv = [header, ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detail.account.name.replace(/\s+/g, '-')}-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleAddFunds() {
    if (!detail) return;
    setAddFundsPending(true);
    setAddFundsError(null);
    const result = await addFundsFromCashAction({
      accountId: detail.account.id,
      amountDollars: addFundsAmount,
      note: addFundsNote,
    });
    setAddFundsPending(false);
    if (result.success) {
      setAddFundsOpen(false);
      setAddFundsAmount('');
      setAddFundsNote('');
      // Refresh detail to show updated balance
      setDetail((prev) =>
        prev && result.newBalanceInCents !== undefined
          ? { ...prev, account: { ...prev.account, balanceInCents: result.newBalanceInCents! } }
          : prev
      );
    } else {
      setAddFundsError(result.error);
    }
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!loading && !error && detail === null) {
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

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
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
          Couldn&apos;t load account
        </div>
        <div className="muted" style={{ marginBottom: 24 }}>
          {error}
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setRetrySignal((n) => n + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  // Keep the skeleton only during the very first load (detail === null && loading).
  // Subsequent period switches show the stale chart with reduced opacity.
  const isInitialLoad = loading && detail === null;

  if (isInitialLoad) {
    return (
      <div style={{ padding: "8px 28px 36px" }}>
        {/* Back button placeholder */}
        <div
          style={{
            width: 64,
            height: 28,
            borderRadius: 6,
            background: "var(--border-2)",
            marginBottom: 14,
          }}
          aria-hidden
        />
        {/* Header skeleton */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "var(--border-2)",
            }}
            aria-hidden
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                width: 200,
                height: 28,
                borderRadius: 6,
                background: "var(--border-2)",
              }}
              aria-hidden
            />
            <div
              style={{
                width: 160,
                height: 14,
                borderRadius: 4,
                background: "var(--border-2)",
              }}
              aria-hidden
            />
          </div>
        </div>
        {/* Card skeleton */}
        <div
          className="card"
          style={{ padding: 28, height: 300, background: "var(--border-2)", opacity: 0.5 }}
          aria-label="Loading account data"
          aria-busy="true"
        />
      </div>
    );
  }

  // At this point detail is non-null (either loaded or stale while re-fetching)
  const { account: a, recentTransactions, monthlySummary } = detail!;

  const accountTypeLabelMap: Record<string, string> = {
    checking: "Checking",
    savings: `Savings${a.apyBps ? ` · ${(a.apyBps / 100).toFixed(2)}% APY` : ""}`,
    investment: "Investment",
  };
  const typeLabel = accountTypeLabelMap[a.type] ?? a.type;

  const historyData = detail!.balanceHistoryByPeriod[period];
  const periodMin = Math.min(...historyData);
  const periodMax = Math.max(...historyData);

  return (
    <div style={{ padding: "8px 28px 36px", opacity: loading ? 0.6 : 1, transition: "opacity 0.15s ease" }}>
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
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
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
              flexShrink: 0,
            }}
            aria-hidden
          >
            <Icon name="bank" size={24} stroke={1.7} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{ fontSize: "clamp(1.25rem, 3vw, 2rem)", margin: 0, lineHeight: 1.05, fontWeight: 700 }}
            >
              {a.name}
            </h1>
            <div className="muted" style={{ marginTop: 4 }}>
              {typeLabel} · {a.number} · synced {a.lastSync}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-sm"
            type="button"
            onClick={handleSync}
            disabled={syncing}
            aria-busy={syncing}
            style={syncing ? { opacity: 0.7 } : undefined}
          >
            <Icon name="refresh" size={13} /> {syncing ? 'Syncing…' : 'Sync'}
          </button>
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => { setSettingsName(detail?.account.name ?? ''); setSettingsOpen(true); }}
          >
            Settings
          </button>
        </div>
      </div>

      <div
        className="grid-2col-bills"
        style={{ alignItems: "start" }}
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
                className="num"
                style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}
              >
                {fmtExact(a.balanceInCents)}
              </span>
              <span className="pill pill-pos">
                <Icon name="arrowUp" size={11} />
                {fmt(a.weekDeltaInCents)} this week
              </span>
            </div>
            <div style={{ marginTop: 18 }}>
              <AreaChart
                data={historyData}
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
              <PeriodSelector
                periods={PERIODS}
                defaultIndex={DEFAULT_PERIOD_INDEX}
                onChange={(p) => setPeriod(p as Period)}
              />
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
                    {fmt(periodMin)}
                  </span>
                </span>
                <span className="dim">·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  High{" "}
                  <span className="num" style={{ color: "var(--ink-2)" }}>
                    {fmt(periodMax)}
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
                    {fmtExact(r.amountInCents)}
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
                ["Money in",  fmtExact(monthlySummary.moneyInInCents),   "pos"],
                ["Money out", `−${fmtExact(monthlySummary.moneyOutInCents)}`, undefined],
                ["Fees",      monthlySummary.feesInCents === 0 ? fmtExact(0) : fmtExact(monthlySummary.feesInCents), "muted"],
                ["Interest",  monthlySummary.interestInCents > 0 ? `+${fmtExact(monthlySummary.interestInCents)}` : fmtExact(0), monthlySummary.interestInCents > 0 ? "pos" : undefined],
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
                onClick={() => setAddFundsOpen(true)}
              >
                <Icon name="plus" size={14} /> Add funds from cash
              </button>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "flex-start" }}
                type="button"
                onClick={() => setTransferOpen(true)}
              >
                <Icon name="arrowR" size={14} /> Transfer money
              </button>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "flex-start" }}
                type="button"
                onClick={() => setAutoSaveOpen(true)}
              >
                <Icon name="spark" size={14} /> Set up auto-save
              </button>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "flex-start" }}
                type="button"
                onClick={handleExportCsv}
                disabled={exporting}
              >
                <Icon name="download" size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add funds from cash modal */}
      {addFundsOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setAddFundsOpen(false); }}
        >
          <div
            style={{
              background: 'var(--surface)', borderRadius: 16, padding: 28,
              width: '100%', maxWidth: 400, border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>Add funds from cash</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)' }}>
              Records a cash deposit into <strong>{detail?.account.name}</strong>.
            </p>
            {addFundsError && (
              <div style={{ color: 'var(--neg)', fontSize: 12, marginBottom: 12 }}>{addFundsError}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="0.00"
                  min="0.01"
                  step="any"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Note <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. ATM withdrawal, sold item…"
                  maxLength={100}
                  value={addFundsNote}
                  onChange={(e) => setAddFundsNote(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleAddFunds}
                disabled={addFundsPending || !addFundsAmount}
                aria-busy={addFundsPending}
              >
                {addFundsPending ? 'Adding…' : 'Add funds'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setAddFundsOpen(false); setAddFundsError(null); }}
                disabled={addFundsPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {transferOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setTransferOpen(false); }}
        >
          <div
            style={{
              background: 'var(--surface)', borderRadius: 16, padding: 28,
              width: '100%', maxWidth: 400, border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Transfer money</h2>
            {transferError && <div style={{ color: 'var(--neg)', fontSize: 12, marginBottom: 12 }}>{transferError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>From</label>
                <div className="field-input" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                  {detail?.account.name} {detail?.account.number}
                </div>
              </div>
              <div className="field">
                <label>To</label>
                <select className="field-input" value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                  {otherAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} {acc.number}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="0.00"
                  min="0.01"
                  step="any"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setTransferOpen(false)} disabled={transferring}>Cancel</button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleTransfer}
                disabled={transferring || !transferTo || !transferAmount}
              >
                {transferring ? 'Transferring…' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save modal */}
      {autoSaveOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) setAutoSaveOpen(false); }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Set up auto-save</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)' }}>
              Automatically transfer a set amount from this account to a savings goal on a schedule.
            </p>
            {autoSaveError && <div style={{ color: 'var(--neg)', fontSize: 12, marginBottom: 12 }}>{autoSaveError}</div>}
            {autoSaveSuccess ? (
              <div>
                <div style={{ color: 'var(--pos)', fontSize: 13, marginBottom: 20 }}>✓ {autoSaveSuccess}</div>
                <button className="btn btn-primary" style={{ width: '100%' }} type="button" onClick={() => { setAutoSaveOpen(false); setAutoSaveSuccess(null); }}>Done</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label>Savings goal</label>
                  <select className="field-input" value={autoSaveGoal} onChange={e => setAutoSaveGoal(e.target.value)}>
                    {goals.length === 0
                      ? <option value="">No goals found — add one first</option>
                      : goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                    }
                  </select>
                </div>
                <div className="field">
                  <label>Amount per transfer</label>
                  <input
                    type="number"
                    className="field-input"
                    placeholder="0.00"
                    min="0.01"
                    step="any"
                    value={autoSaveAmount}
                    onChange={e => setAutoSaveAmount(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Frequency</label>
                  <select className="field-input" value={autoSaveFreq} onChange={e => setAutoSaveFreq(e.target.value as 'weekly' | 'monthly')}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button className="btn btn-ghost" type="button" onClick={() => setAutoSaveOpen(false)} disabled={autoSaving}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleAutoSave}
                    disabled={autoSaving || !autoSaveGoal || !autoSaveAmount}
                  >
                    {autoSaving ? 'Setting up…' : 'Start auto-saving'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) setSettingsOpen(false); }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Account settings</h2>
            {settingsError && <div style={{ color: 'var(--neg)', fontSize: 12, marginBottom: 12 }}>{settingsError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Account name</label>
                <input
                  type="text"
                  className="field-input"
                  value={settingsName}
                  onChange={e => setSettingsName(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 20 }}>
              <button
                className="btn"
                style={{ color: 'var(--neg)', borderColor: 'var(--neg)' }}
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || savingSettings}
              >
                {deletingAccount ? 'Deleting…' : 'Delete account'}
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" type="button" onClick={() => setSettingsOpen(false)} disabled={savingSettings}>Cancel</button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings || !settingsName.trim()}
                >
                  {savingSettings ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
