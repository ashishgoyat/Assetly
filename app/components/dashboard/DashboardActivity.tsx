"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import BillRow from "@/app/components/dashboard/BillRow";
import TransactionRow from "@/app/components/dashboard/TransactionRow";
import GoalCard from "@/app/components/dashboard/GoalCard";
import { useFormatCurrency } from "@/app/contexts/CurrencyContext";
import type { Bill, Transaction, Goal } from "@/contracts/api-contracts";

interface Props {
  initialBills: Bill[];
  initialTransactions: Transaction[];
  initialGoals: Goal[];
}

export default function DashboardActivity({
  initialBills,
  initialTransactions,
  initialGoals,
}: Props) {
  const { fmtCompact } = useFormatCurrency();
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const totalSaved = goals.reduce((s, g) => s + g.currentInCents, 0);

  return (
    <>
      {/* Row 2: Upcoming bills + Recent activity */}
      <div className="grid-2col-bills" style={{ marginBottom: 14 }}>
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

          {bills.length === 0 ? (
            <div
              className="empty-state"
              style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}
            >
              <Icon name="bill" size={28} />
              <div style={{ marginTop: 8, fontSize: 13 }}>No upcoming bills</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {bills.map((b) => (
                <BillRow
                  key={b.id}
                  bill={b}
                  onPaid={(id) => setBills((prev) => prev.filter((x) => x.id !== id))}
                  onSkipped={(id) =>
                    setBills((prev) =>
                      prev.map((x) => {
                        if (x.id !== id) return x;
                        const newDueInDays = x.dueInDays + 30;
                        const d = new Date();
                        d.setDate(d.getDate() + newDueInDays);
                        const newDueDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        return { ...x, dueDate: newDueDate, dueInDays: newDueInDays, isUrgent: false };
                      })
                    )
                  }
                />
              ))}
            </div>
          )}
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
            <Link href="/dashboard/transactions" className="btn btn-sm btn-ghost">
              All transactions <Icon name="chev" size={11} />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div
              className="empty-state"
              style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}
            >
              <Icon name="list" size={28} />
              <div style={{ marginTop: 8, fontSize: 13 }}>No recent transactions</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {transactions.slice(0, 6).map((r) => (
                <TransactionRow
                  key={r.id}
                  tx={r}
                  onExcluded={(id) =>
                    setTransactions((prev) => prev.filter((x) => x.id !== id))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: AI Insight (left) + Saving goals (right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.8fr",
          gap: 14,
          marginBottom: 14,
          alignItems: "start",
        }}
      >
        {/* AI Insight dark card */}
        <div
          className="card-dark"
          style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="sparkle" size={15} color="rgba(255,255,255,0.7)" />
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              AI insight
            </span>
          </div>

          {transactions.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
              Add transactions to unlock personalised insights about your spending habits.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
              {(() => {
                const expenses = transactions.filter((t) => t.type === "expense");
                const total = expenses.reduce((s, t) => s + t.amountInCents, 0);
                const topTx = expenses.sort((a, b) => b.amountInCents - a.amountInCents)[0];
                if (!topTx) return "Keep tracking your spending to see insights here.";
                return `Your top expense recently was ${topTx.merchant} (${fmtCompact(topTx.amountInCents)}). You've spent ${fmtCompact(total)} across ${expenses.length} transaction${expenses.length !== 1 ? "s" : ""} — keep an eye on your budget limits.`;
              })()}
            </p>
          )}

          <Link
            href="/dashboard/transactions"
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              marginTop: "auto",
            }}
          >
            View all transactions <Icon name="chev" size={11} color="rgba(255,255,255,0.4)" />
          </Link>
        </div>

        {/* Saving goals */}
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
                {fmtCompact(totalSaved)} saved
              </div>
            </div>
            <Link href="/dashboard/goals" className="btn btn-sm btn-ghost">
              See all <Icon name="chev" size={11} />
            </Link>
          </div>

          {goals.length === 0 ? (
            <div
              className="empty-state"
              style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}
            >
              <Icon name="goal" size={28} />
              <div style={{ marginTop: 8, fontSize: 13 }}>No saving goals yet</div>
            </div>
          ) : (
            <div className="grid-3col" style={{ gap: 12 }}>
              {goals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onUpdated={(updated) =>
                    setGoals((prev) =>
                      prev.map((x) => (x.id === updated.id ? updated : x))
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
