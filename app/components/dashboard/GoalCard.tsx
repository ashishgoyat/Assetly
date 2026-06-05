"use client";

import { useState, useTransition } from "react";
import { useFormatCurrency } from "@/app/contexts/CurrencyContext";
import {
  addFundsToGoalAction,
  setGoalMonthly,
} from "@/app/dashboard/home-actions";
import type { Goal } from "@/contracts/api-contracts";

type Mode = "actions" | "addFunds" | "adjustMonthly";

interface GoalCardProps {
  goal: Goal;
  onUpdated?: (goal: Goal) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function GoalCard({ goal: g, onUpdated }: GoalCardProps) {
  const { fmtCompact } = useFormatCurrency();
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("actions");
  const [amountInput, setAmountInput] = useState("");
  const [monthlyInput, setMonthlyInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openAddFunds() {
    setError(null);
    setAmountInput("");
    setMode("addFunds");
  }

  function openAdjustMonthly() {
    setError(null);
    setMonthlyInput("");
    setMode("adjustMonthly");
  }

  function handleAddFunds() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", g.id);
      fd.set("amountDollars", amountInput);
      const res = await addFundsToGoalAction(fd);
      if (res.success) {
        const addedCents = Math.round(parseFloat(amountInput) * 100);
        const newCurrent = g.currentInCents + (Number.isFinite(addedCents) ? addedCents : 0);
        const newPct =
          g.targetInCents > 0
            ? clamp(Math.round((newCurrent / g.targetInCents) * 100), 0, 100)
            : 0;
        onUpdated?.({ ...g, currentInCents: newCurrent, percentageComplete: newPct });
        setMode("actions");
        setAmountInput("");
      } else {
        setError(res.error);
      }
    });
  }

  function handleSaveMonthly() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", g.id);
      fd.set("monthlyDollars", monthlyInput);
      const res = await setGoalMonthly(fd);
      if (res.success) {
        const newMonthly = Math.round(parseFloat(monthlyInput) * 100);
        onUpdated?.({
          ...g,
          monthlyContributionInCents: Number.isFinite(newMonthly) ? newMonthly : g.monthlyContributionInCents,
        });
        setMode("actions");
        setMonthlyInput("");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div
      className="card-flat"
      style={{ padding: 14, cursor: "pointer" }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((o) => !o)}
      onKeyDown={(e) => e.key === "Enter" && setExpanded((o) => !o)}
    >
      <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>{g.name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
        <span className="num" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
          {fmtCompact(g.currentInCents)}
        </span>
        <span className="num" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          / {fmtCompact(g.targetInCents)}
        </span>
      </div>
      <div className="bar">
        <i style={{ transform: `scaleX(${g.percentageComplete / 100})` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
        <span style={{ color: "var(--accent-2)", fontWeight: 600 }}>{g.percentageComplete}%</span>
        <span style={{ color: "var(--ink-3)" }}>ETA {g.eta}</span>
      </div>

      <div
        className="anim-collapsible"
        data-open={expanded ? "true" : "false"}
        aria-hidden={!expanded}
      >
        <div className="anim-collapsible-inner">
        <div
          style={{ marginTop: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          {mode === "addFunds" ? (
            <div
              style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
              aria-busy={isPending}
            >
              <input
                type="number"
                step="0.01"
                className="field-input"
                style={{ height: 28, padding: "0 8px", fontSize: 12, minWidth: 110 }}
                placeholder="$ amount"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                disabled={isPending}
                aria-label="Amount in dollars"
              />
              <button
                className="btn btn-sm btn-primary"
                type="button"
                disabled={isPending}
                onClick={handleAddFunds}
              >
                Add
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                aria-label="Cancel"
                disabled={isPending}
                onClick={() => setMode("actions")}
              >
                ×
              </button>
            </div>
          ) : mode === "adjustMonthly" ? (
            <div
              style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
              aria-busy={isPending}
            >
              <input
                type="number"
                step="0.01"
                className="field-input"
                style={{ height: 28, padding: "0 8px", fontSize: 12, minWidth: 110 }}
                placeholder="$ monthly"
                value={monthlyInput}
                onChange={(e) => setMonthlyInput(e.target.value)}
                disabled={isPending}
                aria-label="Monthly contribution in dollars"
              />
              <button
                className="btn btn-sm btn-primary"
                type="button"
                disabled={isPending}
                onClick={handleSaveMonthly}
              >
                Save
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                aria-label="Cancel"
                disabled={isPending}
                onClick={() => setMode("actions")}
              >
                ×
              </button>
            </div>
          ) : (
            <div
              style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}
              aria-busy={isPending}
            >
              <button
                className="btn btn-sm btn-primary"
                type="button"
                disabled={isPending}
                onClick={openAddFunds}
              >
                Add funds
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                disabled={isPending}
                onClick={openAdjustMonthly}
              >
                Adjust monthly
              </button>
            </div>
          )}
          {error && (
            <div style={{ marginTop: 6, color: "var(--neg)", fontSize: 11 }}>
              {error}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
