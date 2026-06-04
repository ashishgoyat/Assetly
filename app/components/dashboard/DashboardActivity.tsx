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

      {/* Row 3: Saving goals (full width) */}
      <div style={{ marginBottom: 14 }}>
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
