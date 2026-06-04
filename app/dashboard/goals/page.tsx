"use client";

/**
 * Goals page — Client Component
 * Fetches from GET /api/goals and manages goal card quick-edit actions.
 */

import { useState, useEffect } from "react";
import Icon from "@/app/components/ui/Icon";
import type { Goal, GoalSummary } from "@/contracts/api-contracts";
import { formatPercent } from "@/lib/format";
import { useFormatCurrency } from "@/app/contexts/CurrencyContext";
import NewGoalButton from "@/app/dashboard/goals/NewGoalButton";
import {
  addFundsToGoal,
  updateGoalMonthly,
  deleteGoal,
} from "@/app/dashboard/goals/actions";

// ---------------------------------------------------------------------------
// GoalCard component
// ---------------------------------------------------------------------------

function GoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: Goal;
  onUpdate: (updated: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const { fmt, fmtCompact } = useFormatCurrency();
  const [expanded, setExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState<"funds" | "monthly" | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleActionSubmit() {
    if (!inputValue) return;
    setSubmitting(true);
    setActionError(null);

    const result =
      activeAction === "funds"
        ? await addFundsToGoal(goal.id, inputValue)
        : await updateGoalMonthly(goal.id, inputValue);

    if (result.success) {
      setActiveAction(null);
      setInputValue("");
      const addedCents = Math.round(parseFloat(inputValue) * 100);
      if (activeAction === "funds") {
        const newCurrent = goal.currentInCents + addedCents;
        const newPct = Math.min(
          100,
          Math.round((newCurrent / goal.targetInCents) * 100)
        );
        onUpdate({ ...goal, currentInCents: newCurrent, percentageComplete: newPct });
      } else {
        onUpdate({ ...goal, monthlyContributionInCents: addedCents });
      }
    } else {
      setActionError(result.error);
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    const result = await deleteGoal(goal.id);
    if (result.success) {
      onDelete(goal.id);
    } else {
      setActionError(result.error);
    }
  }

  function toggleExpanded() {
    setExpanded((v) => {
      const next = !v;
      if (!next) {
        // Collapsing — reset any in-progress action
        setActiveAction(null);
        setInputValue("");
        setActionError(null);
      }
      return next;
    });
  }

  function handleCardKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpanded();
    }
  }

  return (
    <article
      className={`card${expanded ? "" : " card-hoverable"}`}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`Open actions for ${goal.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleExpanded();
      }}
      onKeyDown={handleCardKeyDown}
      style={{ padding: 22, position: "relative", overflow: "visible" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 18,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: goal.color + "20",
            color: goal.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden
        >
          <Icon name={goal.icon as "lock"} size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            {goal.name}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {goal.vibe} · {fmt(goal.monthlyContributionInCents)}/mo auto
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
          pointerEvents: "none",
        }}
      >
        <div>
          <span className="serif num" style={{ fontSize: 32 }}>
            {fmtCompact(goal.currentInCents)}
          </span>
          <span className="muted" style={{ marginLeft: 4 }}>
            of {fmtCompact(goal.targetInCents)}
          </span>
        </div>
        <span
          className="num serif"
          style={{
            fontSize: 28,
            color: goal.color,
            fontWeight: 500,
          }}
        >
          {goal.percentageComplete}%
        </span>
      </div>

      <div
        className="bar lg"
        role="progressbar"
        aria-valuenow={goal.percentageComplete}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name}: ${goal.percentageComplete}% complete`}
        style={{ pointerEvents: "none" }}
      >
        <i
          style={{
            background: goal.color,
            transform: `scaleX(${goal.percentageComplete / 100})`,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          fontSize: 12,
          pointerEvents: "none",
        }}
      >
        <span style={{ color: "var(--ink-3)" }}>
          ETA ·{" "}
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>
            {goal.eta}
          </span>
        </span>
        <span style={{ color: "var(--ink-3)" }}>
          <span
            className="num"
            style={{ fontWeight: 600, color: "var(--ink-2)" }}
          >
            {fmtCompact(goal.targetInCents - goal.currentInCents)}
          </span>{" "}
          to go
        </span>
      </div>

      {/* Inline action panel — wrapped in .anim-collapsible for smooth expand */}
      <div
        className="anim-collapsible"
        data-open={expanded ? "true" : "false"}
        aria-hidden={!expanded}
      >
        <div className="anim-collapsible-inner">
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
            style={{
              marginTop: 14,
              padding: "12px 0 0",
              borderTop: "1px solid var(--border-2)",
            }}
          >
            {/* Action chooser */}
            {!activeAction && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => {
                    setActiveAction("funds");
                    setInputValue("");
                    setActionError(null);
                  }}
                  tabIndex={expanded ? 0 : -1}
                >
                  <Icon name="plus" size={12} /> Add funds
                </button>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => {
                    setActiveAction("monthly");
                    setInputValue(String(goal.monthlyContributionInCents / 100));
                    setActionError(null);
                  }}
                  tabIndex={expanded ? 0 : -1}
                >
                  <Icon name="refresh" size={12} /> Adjust monthly
                </button>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={handleDelete}
                  aria-label={`Delete ${goal.name}`}
                  tabIndex={expanded ? 0 : -1}
                  style={{
                    marginLeft: "auto",
                    color: "var(--neg)",
                    borderColor: "var(--neg-soft)",
                    background: "var(--neg-soft)",
                  }}
                >
                  <Icon name="trash" size={12} /> Delete
                </button>
              </div>
            )}

            {/* Active action form */}
            {activeAction && (
              <div className="anim-fade-in">
                <div
                  style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}
                >
                  {activeAction === "funds"
                    ? "Amount to add ($)"
                    : "New monthly amount ($)"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={activeAction === "funds" ? "100" : "200"}
                    aria-label={
                      activeAction === "funds"
                        ? `Amount to add to ${goal.name}`
                        : `New monthly contribution for ${goal.name}`
                    }
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--ink)",
                      fontSize: 13,
                    }}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    type="button"
                    disabled={submitting || !inputValue}
                    onClick={handleActionSubmit}
                  >
                    {submitting ? "…" : "Save"}
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    type="button"
                    onClick={() => {
                      setActiveAction(null);
                      setActionError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {actionError && (
              <div
                className="anim-slide-down"
                style={{ color: "#e53935", fontSize: 11, marginTop: 6 }}
              >
                {actionError}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// GoalsPage — main page component
// ---------------------------------------------------------------------------

export default function GoalsPage() {
  const { fmt, fmtCompact } = useFormatCurrency();
  const [data, setData] = useState<GoalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  function handleGoalCreated(goal: Goal) {
    setData((prev) => {
      if (!prev) {
        return {
          totalSavedInCents: 0,
          totalTargetInCents: goal.targetInCents,
          totalMonthlyContributionInCents: goal.monthlyContributionInCents,
          savingsRatePercent: 0,
          savingsRateDeltaPoints: 0,
          activeTransfers: 1,
          goals: [goal],
        };
      }
      return {
        ...prev,
        totalTargetInCents: prev.totalTargetInCents + goal.targetInCents,
        totalMonthlyContributionInCents:
          prev.totalMonthlyContributionInCents + goal.monthlyContributionInCents,
        activeTransfers: prev.activeTransfers + 1,
        goals: [goal, ...prev.goals],
      };
    });
  }

  function retry() {
    setRetryCount((c) => c + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/goals", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (json.data) setData(json.data as GoalSummary);
        else setError(true);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [retryCount]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="page-content">
        <div
          className="skeleton"
          style={{ width: 220, height: 44, borderRadius: 8, marginBottom: 8 }}
        />
        <div
          className="skeleton"
          style={{ width: 280, height: 24, borderRadius: 6, marginBottom: 22 }}
        />
        <div
          className="skeleton"
          style={{ height: 130, borderRadius: 16, marginBottom: 18 }}
        />
        <div className="grid-2col">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 180, borderRadius: 16 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-content">
        <div
          className="card"
          style={{
            padding: 40,
            textAlign: "center",
            maxWidth: 400,
            margin: "80px auto",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            <Icon name="info" size={32} />
          </div>
          <div
            style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}
          >
            Could not load goals
          </div>
          <div className="muted" style={{ marginBottom: 20, fontSize: 13 }}>
            There was a problem fetching your goals data. Please try again.
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={retry}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.goals.length === 0) {
    return (
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div>
            <h1
              className="serif"
              style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}
            >
              Goals
            </h1>
            <div className="muted" style={{ marginTop: 4 }}>
              No goals yet
            </div>
          </div>
          <NewGoalButton onCreated={handleGoalCreated} />
        </div>
        <div
          className="card"
          style={{
            padding: 48,
            textAlign: "center",
            maxWidth: 480,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <div
            style={{ color: "var(--ink-3)", marginBottom: 16 }}
            aria-hidden
          >
            <Icon name="goal" size={32} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--ink)" }}>
            No savings goals yet
          </div>
          <div
            className="muted"
            style={{ marginBottom: 24, fontSize: 13, lineHeight: 1.6 }}
          >
            Set a target and track your progress month by month.
          </div>
          <NewGoalButton onCreated={handleGoalCreated} />
        </div>
      </div>
    );
  }

  const {
    totalSavedInCents,
    totalTargetInCents,
    totalMonthlyContributionInCents,
    activeTransfers,
    goals,
  } = data;

  return (
    <div className="page-content">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            className="serif"
            style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}
          >
            Goals
          </h1>
          <div className="muted" style={{ marginTop: 4 }}>
            {fmtCompact(totalSavedInCents)} saved across {goals.length}{" "}
            goals
          </div>
        </div>
        <NewGoalButton onCreated={handleGoalCreated} />
      </div>

      {/* Hero strip */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="grid-2col" style={{ gap: 32, alignItems: "center" }}>
          <div>
            <div className="sec-label">Total saved</div>
            <div
              className="serif num"
              style={{ fontSize: 54, lineHeight: 1, marginTop: 8 }}
            >
              {fmtCompact(totalSavedInCents)}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              of{" "}
              <span className="num">
                {fmtCompact(totalTargetInCents)}
              </span>{" "}
              ·{" "}
              {formatPercent(
                Math.round((totalSavedInCents / totalTargetInCents) * 100)
              )}{" "}
              there
            </div>
          </div>
          <div>
            <div className="sec-label">Auto-saving</div>
            <div
              className="serif num"
              style={{
                fontSize: 36,
                lineHeight: 1,
                marginTop: 8,
                color: "var(--pos)",
              }}
            >
              {fmt(totalMonthlyContributionInCents)}
              <span style={{ fontSize: 16, color: "var(--ink-3)" }}>/mo</span>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {activeTransfers} active transfers
            </div>
          </div>
        </div>
      </div>

      {/* Goal cards */}
      <div className="grid-2col">
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onUpdate={(updated) => {
              setData((prev) => {
                if (!prev) return prev;
                const newGoals = prev.goals.map((x) => x.id === updated.id ? updated : x);
                return {
                  ...prev,
                  goals: newGoals,
                  totalSavedInCents: newGoals.reduce((s, g) => s + g.currentInCents, 0),
                };
              });
            }}
            onDelete={(id) => {
              setData((prev) => {
                if (!prev) return prev;
                const newGoals = prev.goals.filter((x) => x.id !== id);
                return {
                  ...prev,
                  goals: newGoals,
                  totalSavedInCents: newGoals.reduce((s, g) => s + g.currentInCents, 0),
                  totalTargetInCents: newGoals.reduce((s, g) => s + g.targetInCents, 0),
                };
              });
            }}
          />
        ))}

        {/* Add new goal */}
        <NewGoalButton variant="dashed" />
      </div>
    </div>
  );
}
