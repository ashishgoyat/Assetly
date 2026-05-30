"use client";

/**
 * Transactions page — Client Component
 * Needs useState for filter + selected transaction detail panel.
 */

import { useState, useEffect, useRef } from "react";
import Icon from "@/app/components/ui/Icon";
import MerchantIcon from "@/app/components/ui/MerchantIcon";
import Sparkline from "@/app/components/charts/Sparkline";
import AddTransactionButton from "@/app/dashboard/transactions/AddTransactionButton";
import type {
  Account,
  Transaction,
  TransactionCategory,
  TransactionsSummary,
} from "@/contracts/api-contracts";
import { MOCK_TRANSACTIONS, MOCK_TX_SUMMARY } from "@/lib/mock-data";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import {
  deleteTransaction,
  updateTransactionAction,
} from "@/app/dashboard/transactions/actions";

type FilterValue = "all" | TransactionCategory;

interface PageData {
  transactions: Transaction[];
  summary: TransactionsSummary;
}

async function fetchTransactions(): Promise<PageData> {
  try {
    // TODO: awaiting backend — expects GET /api/transactions, see contracts/api-contracts.ts
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/transactions?page=1&pageSize=50`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return {
      transactions: json.data.items.items as Transaction[],
      summary: json.data.summary as TransactionsSummary,
    };
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.error("[transactions] API not available, using mock data:", err);
    return { transactions: MOCK_TRANSACTIONS, summary: MOCK_TX_SUMMARY };
  }
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function exportCsv(rows: Transaction[]) {
  const header = "Date,Time,Merchant,Category,Account,Type,Amount,Status";
  const lines = rows.map((t) =>
    [
      t.date,
      t.time,
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.category,
      `"${t.accountLabel.replace(/"/g, '""')}"`,
      t.type,
      (t.amountInCents / 100).toFixed(2),
      t.status,
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const currency = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "posted" | "pending">("all");
  const filterRef = useRef<HTMLDivElement>(null);

  // Month picker state
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTransactions()
      .then(({ transactions, summary }) => {
        setTransactions(transactions);
        setSummary(summary);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError("Failed to load transactions.");
        setLoading(false);
      });
  }, []);

  // Fetch accounts once for the account dropdown in TxDetailPanel
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    fetch(`${base}/api/accounts`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setAccounts(d.data as Account[]);
      })
      .catch(() => {}); // non-critical, form still works with current value
  }, []);

  // Outside-click handler for filter panel
  useEffect(() => {
    if (!filterOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [filterOpen]);

  // Outside-click handler for month picker
  useEffect(() => {
    if (!monthOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setMonthOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [monthOpen]);

  const categories = Array.from(
    new Set(transactions.map((t) => t.category))
  ) as TransactionCategory[];

  const availableMonths = Array.from(
    new Set(transactions.map((t) => t.date.slice(0, 7)))
  )
    .sort()
    .reverse();

  // Chain all four filters in order: category → month → type → status
  let filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.category === filter);
  if (monthFilter !== null)
    filtered = filtered.filter((t) => t.date.startsWith(monthFilter));
  if (typeFilter !== "all")
    filtered = filtered.filter((t) => t.type === typeFilter);
  if (statusFilter !== "all")
    filtered = filtered.filter((t) => t.status === statusFilter);

  const hasActiveFilter = typeFilter !== "all" || statusFilter !== "all";

  if (loading) {
    return (
      <div className="page-content">
        <div
          className="skeleton"
          style={{ width: 200, height: 40, borderRadius: 8, marginBottom: 22 }}
        />
        <div className="grid-4col" style={{ marginBottom: 18 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 80, borderRadius: 16 }}
            />
          ))}
        </div>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="page-content"
        style={{ textAlign: "center", paddingTop: 60 }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Couldn&apos;t load transactions
        </div>
        <div className="muted" style={{ marginBottom: 20 }}>
          There was a problem fetching your data. Please try again.
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchTransactions()
              .then(({ transactions, summary }) => {
                setTransactions(transactions);
                setSummary(summary);
                setLoading(false);
              })
              .catch((err: unknown) => {
                console.error(err);
                setError("Failed to load transactions.");
                setLoading(false);
              });
          }}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1
          className="serif"
          style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}
        >
          Transactions
        </h1>
        <div className="muted" style={{ marginTop: 4 }}>
          {transactions.length} this month across 4 accounts
        </div>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid-4col" style={{ marginBottom: 18 }}>
          {(
            [
              {
                label: "Money in",
                value: `+${formatCurrency(summary.moneyInInCents, currency)}`,
                tone: "pos",
                sparkData: [1, 2, 2, 3, 4, 5, 5, 6],
              },
              {
                label: "Money out",
                value: `−${formatCurrency(summary.moneyOutInCents, currency)}`,
                tone: "ink",
                sparkData: [4, 5, 3, 6, 4, 7, 5, 8],
              },
              {
                label: "Net",
                value:
                  summary.netInCents >= 0
                    ? `+${formatCurrency(summary.netInCents, currency)}`
                    : `−${formatCurrency(Math.abs(summary.netInCents), currency)}`,
                tone: "accent",
                sparkData: [1, 2, 2, 3, 3, 4, 5, 5],
              },
              {
                label: "Daily avg",
                value: formatCurrency(summary.dailyAvgOutInCents, currency),
                tone: "muted",
                sparkData: [3, 4, 3, 5, 4, 5, 4, 5],
              },
            ] as const
          ).map((tile, i) => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="sec-label">{tile.label}</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: 8,
                }}
              >
                <span
                  className="num serif"
                  style={{
                    fontSize: 26,
                    lineHeight: 1,
                    color:
                      tile.tone === "pos"
                        ? "var(--pos)"
                        : tile.tone === "accent"
                          ? "var(--accent-2)"
                          : "var(--ink)",
                  }}
                >
                  {tile.value}
                </span>
                <Sparkline
                  data={tile.sparkData}
                  w={70}
                  h={26}
                  color={
                    tile.tone === "pos" ? "var(--pos)" : "var(--ink-3)"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Issue 1 fix: use var(--bg) instead of "white" so dark mode text stays visible */}
          <button
            key="all"
            className="btn btn-sm"
            style={{
              background: filter === "all" ? "var(--ink)" : undefined,
              color: filter === "all" ? "var(--bg)" : undefined,
              borderColor: filter === "all" ? "var(--ink)" : undefined,
            }}
            onClick={() => setFilter("all")}
            type="button"
            aria-pressed={filter === "all"}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className="btn btn-sm"
              style={{
                background: filter === c ? "var(--ink)" : undefined,
                color: filter === c ? "var(--bg)" : undefined,
                borderColor: filter === c ? "var(--ink)" : undefined,
              }}
              onClick={() => setFilter(c)}
              type="button"
              aria-pressed={filter === c}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />

        {/* Issue 2a — Filter button with type + status panel */}
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
            aria-haspopup="true"
          >
            <Icon name="filter" size={13} /> Filter
            {hasActiveFilter && (
              <span
                style={{
                  color: "#e53935",
                  fontSize: 8,
                  marginLeft: 2,
                  lineHeight: 1,
                }}
                aria-label="Active filter"
              >
                ●
              </span>
            )}
          </button>
          {filterOpen && (
            <div
              role="dialog"
              aria-label="Filter transactions"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                zIndex: 50,
                minWidth: 200,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-3)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Type
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {(["all", "income", "expense"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTypeFilter(opt)}
                    style={{
                      fontSize: 12,
                      color: "var(--ink-2)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: "3px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 10 }}>
                      {typeFilter === opt ? "●" : "○"}
                    </span>
                    {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-3)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Status
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {(["all", "posted", "pending"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatusFilter(opt)}
                    style={{
                      fontSize: 12,
                      color: "var(--ink-2)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: "3px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 10 }}>
                      {statusFilter === opt ? "●" : "○"}
                    </span>
                    {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Issue 2b — Month button with month picker */}
        <div ref={monthRef} style={{ position: "relative" }}>
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => setMonthOpen((o) => !o)}
            aria-expanded={monthOpen}
            aria-haspopup="true"
          >
            <Icon name="cal" size={13} />{" "}
            {monthFilter ? formatMonthLabel(monthFilter) : "Month"}
          </button>
          {monthOpen && (
            <div
              role="dialog"
              aria-label="Select month"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                zIndex: 50,
                minWidth: 180,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "6px 0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMonthFilter(null);
                  setMonthOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  fontSize: 13,
                  padding: "6px 14px",
                  cursor: "pointer",
                  border: "none",
                  background:
                    monthFilter === null ? "var(--surface-hover)" : "transparent",
                  color: "var(--ink)",
                }}
              >
                All months
              </button>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMonthFilter(m);
                    setMonthOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    fontSize: 13,
                    padding: "6px 14px",
                    cursor: "pointer",
                    border: "none",
                    background:
                      monthFilter === m ? "var(--surface-hover)" : "transparent",
                    color: "var(--ink)",
                  }}
                >
                  {formatMonthLabel(m)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Issue 2c — Export CSV button */}
        <button
          className="btn btn-sm"
          type="button"
          onClick={() => exportCsv(filtered)}
        >
          <Icon name="download" size={13} /> Export CSV
        </button>
        <AddTransactionButton />
      </div>

      {/* Table + Detail panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "1fr 360px" : "1fr",
          gap: 14,
        }}
      >
        {/* Transactions table — wrapped for horizontal scroll on mobile */}
        <div className="table-scroll">
          <div className="card" style={{ padding: 8 }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 48,
                  textAlign: "center",
                  color: "var(--ink-3)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  <Icon name="list" size={32} color="var(--ink-4)" />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  No transactions
                </div>
                <div style={{ fontSize: 12 }}>
                  No {filter !== "all" ? filter.toLowerCase() : ""} transactions
                  found this month.
                </div>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 130px 130px 100px 20px",
                    gap: 12,
                    padding: "10px 14px",
                    fontSize: 10.5,
                    fontFamily: "var(--f-mono)",
                    color: "var(--ink-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    borderBottom: "1px solid var(--border-2)",
                  }}
                >
                  <span />
                  <span>Merchant</span>
                  <span>Category</span>
                  <span>Account</span>
                  <span style={{ textAlign: "right" }}>Amount</span>
                  <span />
                </div>

                {/* Rows */}
                {filtered.map((r) => (
                  <button
                    key={r.id}
                    className="tx-row"
                    style={{
                      gridTemplateColumns: "32px 1fr 130px 130px 100px 20px",
                      background:
                        selected?.id === r.id
                          ? "var(--surface-hover)"
                          : undefined,
                      width: "100%",
                      textAlign: "left",
                    }}
                    onClick={() =>
                      setSelected((prev) => (prev?.id === r.id ? null : r))
                    }
                    aria-expanded={selected?.id === r.id}
                    aria-label={`${r.merchant}, ${formatCurrencyExact(r.amountInCents, currency)}, ${r.category}`}
                    type="button"
                  >
                    <MerchantIcon name={r.merchant} size={32} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                        {r.merchant}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                        {r.date} · {r.time}
                      </div>
                    </div>
                    <span className="pill">{r.category}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {r.accountLabel}
                    </span>
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
                      {formatCurrencyExact(r.amountInCents, currency)}
                    </div>
                    <Icon name="chev" size={14} color="var(--ink-4)" />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
        {/* /table-scroll */}

        {/* Detail panel */}
        {selected && (
          <TxDetailPanel
            key={selected.id}
            tx={selected}
            accounts={accounts}
            onClose={() => setSelected(null)}
            onDelete={(id) => {
              setTransactions((prev) => prev.filter((t) => t.id !== id));
              setSelected(null);
            }}
            onUpdate={(updated) => {
              setTransactions((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t))
              );
              setSelected(updated);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction detail panel
// ---------------------------------------------------------------------------

function TxDetailPanel({
  tx,
  accounts,
  onClose,
  onDelete,
  onUpdate,
}: {
  tx: Transaction;
  accounts: Account[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: Transaction) => void;
}) {
  const currency = useCurrency();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Issue 3 — editable state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    merchant: tx.merchant,
    category: tx.category as string,
    accountLabel: tx.accountLabel,
    status: tx.status as string,
    note: tx.note ?? "",
  });

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteTransaction(tx.id);
    if (result.success) {
      onDelete(tx.id);
    } else {
      setDeleteError(result.error);
      setDeleting(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setForm({
      merchant: tx.merchant,
      category: tx.category as string,
      accountLabel: tx.accountLabel,
      status: tx.status as string,
      note: tx.note ?? "",
    });
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const result = await updateTransactionAction(tx.id, {
      merchant: form.merchant,
      category: form.category,
      accountLabel: form.accountLabel,
      status: form.status,
      note: form.note || null,
    });
    if (result.success) {
      const updated: Transaction = {
        ...tx,
        merchant: form.merchant,
        category: form.category as Transaction["category"],
        accountLabel: form.accountLabel,
        status: form.status as Transaction["status"],
        note: form.note || undefined,
      };
      onUpdate(updated);
      setEditing(false);
    } else {
      setSaveError(result.error);
    }
    setSaving(false);
  }

  const CATEGORIES = [
    "Groceries",
    "Dining",
    "Transport",
    "Shopping",
    "Entertainment",
    "Subscriptions",
    "Bills",
    "Transfers",
    "Income",
    "Utilities",
    "Housing",
    "Fitness",
    "Other",
  ];

  return (
    <aside
      className="card"
      style={{
        padding: 22,
        alignSelf: "flex-start",
        position: "sticky",
        top: 20,
      }}
      aria-label="Transaction details"
    >
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div className="sec-label">Transaction</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!editing && (
            <>
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="btn btn-icon btn-ghost"
                type="button"
                onClick={onClose}
                aria-label="Close detail panel"
              >
                <Icon name="x" size={14} />
              </button>
            </>
          )}
          {editing && (
            <button
              className="btn"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Merchant + amount hero */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        <MerchantIcon name={tx.merchant} size={56} />
        {editing ? (
          <input
            type="text"
            value={form.merchant}
            onChange={(e) =>
              setForm((f) => ({ ...f, merchant: e.target.value }))
            }
            aria-label="Merchant name"
            style={{
              fontSize: 17,
              fontWeight: 600,
              textAlign: "center",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "4px 8px",
              background: "var(--surface-2)",
              color: "var(--ink)",
              width: "100%",
              marginTop: 10,
            }}
          />
        ) : (
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 10 }}>
            {tx.merchant}
          </div>
        )}
        <div
          className="serif num"
          style={{
            fontSize: 36,
            marginTop: 10,
            color: tx.type === "income" ? "var(--pos)" : "var(--ink)",
          }}
        >
          {tx.type === "income" ? "+" : "−"}
          {formatCurrencyExact(tx.amountInCents, currency)}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {tx.date} · {tx.time}
        </div>
      </div>

      {/* Detail rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Category */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Category</span>
          {editing ? (
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              aria-label="Category"
              style={{
                fontSize: 13,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--ink)",
                width: "60%",
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              <span className="pill">{tx.category}</span>
            </span>
          )}
        </div>

        {/* Account */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderTop: "1px solid var(--border-2)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Account</span>
          {editing ? (
            <select
              value={form.accountLabel}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountLabel: e.target.value }))
              }
              aria-label="Account"
              style={{
                fontSize: 13,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--ink)",
                width: "60%",
              }}
            >
              {accounts.length > 0
                ? accounts.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))
                : <option value={form.accountLabel}>{form.accountLabel}</option>
              }
            </select>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {tx.accountLabel}
            </span>
          )}
        </div>

        {/* Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderTop: "1px solid var(--border-2)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Status</span>
          {editing ? (
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              aria-label="Status"
              style={{
                fontSize: 13,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--ink)",
                width: "60%",
              }}
            >
              <option value="posted">Posted</option>
              <option value="pending">Pending</option>
            </select>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              <span className="pill pill-pos">
                <Icon name="check" size={10} />{" "}
                {tx.status === "posted" ? "Posted" : "Pending"}
              </span>
            </span>
          )}
        </div>

      </div>

      {/* Note */}
      <div style={{ marginTop: 18 }}>
        <label
          htmlFor="tx-note"
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--ink-3)",
            marginBottom: 6,
          }}
        >
          Note
        </label>
        <textarea
          id="tx-note"
          value={editing ? form.note : (tx.note ?? "")}
          onChange={
            editing
              ? (e) => setForm((f) => ({ ...f, note: e.target.value }))
              : undefined
          }
          readOnly={!editing}
          placeholder="Add a note…"
          rows={3}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            fontSize: 13,
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            color: "var(--ink)",
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {editing && (
          <>
            <button
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              disabled={saving}
              type="button"
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </>
        )}
        {!editing && (
          <button
            className="btn btn-sm"
            style={{
              flex: 1,
              color: "#e53935",
              borderColor: "#e53935",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            type="button"
            disabled={deleting}
            onClick={handleDelete}
          >
            <span>{deleting ? "Deleting…" : "Delete"}</span>
            {!deleting && <Icon name="trash" size={14} color="#e53935" />}
          </button>
        )}
      </div>
      {editing && saveError && (
        <div style={{ color: "#e53935", fontSize: 12, marginTop: 6, width: "100%" }}>
          {saveError}
        </div>
      )}
      {!editing && deleteError && (
        <div style={{ color: "#e53935", fontSize: 12, marginTop: 6 }}>
          {deleteError}
        </div>
      )}
    </aside>
  );
}
