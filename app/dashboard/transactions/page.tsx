"use client";

/**
 * Transactions page — Client Component
 * Needs useState for filter + selected transaction detail panel.
 */

import { useState, useEffect } from "react";
import Icon from "@/app/components/ui/Icon";
import MerchantIcon from "@/app/components/ui/MerchantIcon";
import Sparkline from "@/app/components/charts/Sparkline";
import AddTransactionButton from "@/app/dashboard/transactions/AddTransactionButton";
import type {
  Transaction,
  TransactionCategory,
  TransactionsSummary,
} from "@/contracts/api-contracts";
import { MOCK_TRANSACTIONS, MOCK_TX_SUMMARY } from "@/lib/mock-data";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const categories = Array.from(
    new Set(transactions.map((t) => t.category))
  ) as TransactionCategory[];

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.category === filter);

  if (loading) {
    return (
      <div className="page-content">
        <div
          className="skeleton"
          style={{ width: 200, height: 40, borderRadius: 8, marginBottom: 22 }}
        />
        <div
          className="grid-4col"
          style={{ marginBottom: 18 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 80, borderRadius: 16 }}
            />
          ))}
        </div>
        <div
          className="skeleton"
          style={{ height: 400, borderRadius: 16 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content" style={{ textAlign: "center", paddingTop: 60 }}>
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
        <div
          className="grid-4col"
          style={{ marginBottom: 18 }}
        >
          {(
            [
              {
                label: "Money in",
                value: `+${formatCurrency(summary.moneyInInCents)}`,
                tone: "pos",
                sparkData: [1, 2, 2, 3, 4, 5, 5, 6],
              },
              {
                label: "Money out",
                value: `−${formatCurrency(summary.moneyOutInCents)}`,
                tone: "ink",
                sparkData: [4, 5, 3, 6, 4, 7, 5, 8],
              },
              {
                label: "Net",
                value:
                  summary.netInCents >= 0
                    ? `+${formatCurrency(summary.netInCents)}`
                    : `−${formatCurrency(Math.abs(summary.netInCents))}`,
                tone: "accent",
                sparkData: [1, 2, 2, 3, 3, 4, 5, 5],
              },
              {
                label: "Daily avg",
                value: formatCurrency(summary.dailyAvgOutInCents),
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
          <button
            key="all"
            className="btn btn-sm"
            style={{
              background: filter === "all" ? "var(--ink)" : undefined,
              color: filter === "all" ? "white" : undefined,
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
                color: filter === c ? "white" : undefined,
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
        <button className="btn btn-sm" type="button">
          <Icon name="filter" size={13} /> Filter
        </button>
        <button className="btn btn-sm" type="button">
          <Icon name="cal" size={13} /> April
        </button>
        <button className="btn btn-sm" type="button">
          <Icon name="download" size={13} /> Export
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
                    setSelected((prev) =>
                      prev?.id === r.id ? null : r
                    )
                  }
                  aria-expanded={selected?.id === r.id}
                  aria-label={`${r.merchant}, ${formatCurrencyExact(r.amountInCents)}, ${r.category}`}
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
                    {formatCurrencyExact(r.amountInCents)}
                  </div>
                  <Icon name="chev" size={14} color="var(--ink-4)" />
                </button>
              ))}
            </>
          )}
        </div>
        </div>{/* /table-scroll */}

        {/* Detail panel */}
        {selected && (
          <TxDetailPanel
            tx={selected}
            onClose={() => setSelected(null)}
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
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div className="sec-label">Transaction</div>
        <button
          className="btn btn-icon btn-ghost"
          onClick={onClose}
          aria-label="Close detail panel"
          type="button"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

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
        <div style={{ fontSize: 17, fontWeight: 600, marginTop: 10 }}>
          {tx.merchant}
        </div>
        <div
          className="serif num"
          style={{
            fontSize: 36,
            marginTop: 10,
            color: tx.type === "income" ? "var(--pos)" : "var(--ink)",
          }}
        >
          {tx.type === "income" ? "+" : "−"}
          {formatCurrencyExact(tx.amountInCents)}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {tx.date} · {tx.time}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {(
          [
            ["Category", <span className="pill" key="c">{tx.category}</span>],
            ["Account", tx.accountLabel],
            [
              "Status",
              <span className="pill pill-pos" key="s">
                <Icon name="check" size={10} /> {tx.status === "posted" ? "Posted" : "Pending"}
              </span>,
            ],
            ["Date", tx.date],
          ] as [string, React.ReactNode][]
        ).map(([label, value], i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderTop: i > 0 ? "1px solid var(--border-2)" : "none",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
              {label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {tx.note !== undefined && (
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
            defaultValue={tx.note}
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
            }}
          />
        </div>
      )}

      {tx.note === undefined && (
        <div style={{ marginTop: 18 }}>
          <label
            htmlFor="tx-note-new"
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
            id="tx-note-new"
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
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn btn-sm" style={{ flex: 1 }} type="button">
          Recategorize
        </button>
        <button className="btn btn-sm" style={{ flex: 1 }} type="button">
          Split
        </button>
      </div>
    </aside>
  );
}
