"use client";

/**
 * Budgets page — Client Component
 * Fetches data dynamically with month picker support.
 */

import { useState, useEffect, useRef } from "react";
import Icon from "@/app/components/ui/Icon";
import DonutChart from "@/app/components/charts/DonutChart";
import BudgetSuggestionCard from "@/app/dashboard/budgets/BudgetSuggestionCard";
import NewBudgetButton from "@/app/dashboard/budgets/NewBudgetButton";
import type { Budget, BudgetSummary } from "@/contracts/api-contracts";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import {
  updateBudgetLimit,
  deleteBudget,
} from "@/app/dashboard/budgets/actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAvailableMonths(): { key: string; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    result.push({ key, label });
  }
  return result;
}

function getCalendarInfo(monthLabel: string): {
  year: number;
  monthNum: number;
  firstWeekday: number;
  numDays: number;
} {
  // monthLabel is like "April 2026"
  const parsed = new Date(`1 ${monthLabel}`);
  const year = parsed.getFullYear();
  const monthNum = parsed.getMonth() + 1;
  const firstWeekday = new Date(year, monthNum - 1, 1).getDay(); // 0=Sun, 6=Sat
  const numDays = new Date(year, monthNum, 0).getDate();
  return { year, monthNum, firstWeekday, numDays };
}

const heatmapIntensityColors = [
  "transparent",
  "#f5edd9",
  "#ecdfc0",
  "#d9c098",
  "#c96442",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BudgetsPage() {
  const currency = useCurrency();
  const [data, setData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const availableMonths = getAvailableMonths();

  // Fetch on month change and on budget-created event
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/budgets?month=${selectedMonth}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!cancelled && json.data) setData(json.data as BudgetSummary);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    function onBudgetCreated() {
      load();
    }
    window.addEventListener("budget-created", onBudgetCreated);

    return () => {
      cancelled = true;
      window.removeEventListener("budget-created", onBudgetCreated);
    };
  }, [selectedMonth, retryCount]);

  // Close month picker on outside click
  useEffect(() => {
    if (!monthPickerOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        monthPickerRef.current &&
        !monthPickerRef.current.contains(e.target as Node)
      ) {
        setMonthPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [monthPickerOpen]);

  // Calendar info derived from data
  const calInfo = data ? getCalendarInfo(data.month) : null;
  const now = new Date();
  const isCurrentMonth =
    calInfo !== null &&
    calInfo.year === now.getFullYear() &&
    calInfo.monthNum === now.getMonth() + 1;
  const todayDay = now.getDate();

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="page-content">
        {/* Header skeleton */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div>
            <div
              className="skeleton"
              style={{ width: 160, height: 42, borderRadius: 8, marginBottom: 8 }}
            />
            <div
              className="skeleton"
              style={{ width: 220, height: 16, borderRadius: 6 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              className="skeleton"
              style={{ width: 90, height: 30, borderRadius: 999 }}
            />
            <div
              className="skeleton"
              style={{ width: 110, height: 30, borderRadius: 999 }}
            />
          </div>
        </div>

        <div className="grid-2col-budgets">
          {/* Left column skeletons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              className="skeleton"
              style={{ height: 160, borderRadius: 16 }}
            />
            <div
              className="skeleton"
              style={{ height: 90, borderRadius: 16 }}
            />
            <div
              className="skeleton"
              style={{ height: 90, borderRadius: 16 }}
            />
            <div
              className="skeleton"
              style={{ height: 90, borderRadius: 16 }}
            />
            <div
              className="skeleton"
              style={{ height: 90, borderRadius: 16 }}
            />
          </div>
          {/* Right column skeletons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              className="skeleton"
              style={{ height: 240, borderRadius: 16 }}
            />
            <div
              className="skeleton"
              style={{ height: 80, borderRadius: 16 }}
            />
            <div
              className="skeleton"
              style={{ height: 80, borderRadius: 16 }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (!data) {
    return (
      <div className="page-content">
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            color: "var(--ink-3)",
          }}
        >
          <Icon name="pie" size={40} color="var(--ink-4)" />
          <div
            style={{
              fontWeight: 600,
              fontSize: 16,
              marginTop: 16,
              marginBottom: 8,
              color: "var(--ink)",
            }}
          >
            Could not load budgets
          </div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>
            Something went wrong fetching budget data.
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    month,
    daysLeft,
    totalSpentInCents,
    totalLimitInCents,
    percentageUsed,
    remainingInCents,
    dailyLimitGoingForwardInCents,
    budgets,
    dailySpendHistory,
    vsLastMonth,
  } = data;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
            Budgets
          </h1>
          <div className="muted" style={{ marginTop: 4 }}>
            {month} ·{" "}
            {daysLeft > 0 ? `${daysLeft} days left` : "Month complete"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Month picker */}
          <div ref={monthPickerRef} style={{ position: "relative" }}>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => setMonthPickerOpen((o) => !o)}
              aria-expanded={monthPickerOpen}
              aria-label={`Select month — currently ${month}`}
            >
              {data.month.split(" ")[0] ??
                availableMonths[0].label.split(" ")[0]}
              <Icon name="chevd" size={11} />
            </button>
            {monthPickerOpen && (
              <div
                role="listbox"
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
                {availableMonths.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={selectedMonth === key}
                    onClick={() => {
                      setSelectedMonth(key);
                      setMonthPickerOpen(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "7px 14px",
                      fontSize: 13,
                      background:
                        selectedMonth === key
                          ? "var(--surface-hover)"
                          : "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: selectedMonth === key ? 600 : 400,
                      color: "var(--ink)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <NewBudgetButton />
        </div>
      </div>

      <div className="grid-2col-budgets">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Hero summary */}
          <div
            className="card-accent"
            style={{ padding: 24, display: "flex", gap: 24, alignItems: "center" }}
          >
            <DonutChart
              size={140}
              strokeW={18}
              label={`${Math.round(percentageUsed)}%`}
              sub="used"
              segs={budgets.map((b) => ({
                v: Math.min(b.spentInCents, b.limitInCents),
                c: b.color,
                label: b.name,
              }))}
            />
            <div style={{ flex: 1 }}>
              <div
                className="sec-label"
                style={{ color: "var(--accent-2)" }}
              >
                Spent of {formatCurrency(totalLimitInCents, currency)} monthly budget
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <span
                  className="serif num"
                  style={{ fontSize: 44, lineHeight: 1 }}
                >
                  {formatCurrency(totalSpentInCents, currency)}
                </span>
                <span style={{ color: "var(--ink-3)" }}>
                  · {formatCurrency(remainingInCents, currency)} left
                </span>
              </div>
              <div
                className="bar lg"
                style={{ marginTop: 14, background: "var(--surface)" }}
              >
                <i
                  style={{
                    background: "var(--accent)",
                    transform: `scaleX(${Math.min(percentageUsed, 100) / 100})`,
                  }}
                />
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-2)" }}>
                You&apos;re on track — daily limit going forward:{" "}
                <span className="num" style={{ fontWeight: 600 }}>
                  {formatCurrency(dailyLimitGoingForwardInCents, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Budget cards */}
          {budgets.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--ink-3)",
              }}
            >
              <Icon name="pie" size={28} color="var(--ink-4)" />
              <div style={{ marginTop: 12, fontSize: 13 }}>
                No budgets yet. Create one to start tracking.
              </div>
            </div>
          ) : (
            budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                onUpdate={(updated) =>
                  setData((d) =>
                    d
                      ? {
                          ...d,
                          budgets: d.budgets.map((x) =>
                            x.id === updated.id ? updated : x
                          ),
                        }
                      : d
                  )
                }
                onDelete={(id) =>
                  setData((d) =>
                    d
                      ? {
                          ...d,
                          budgets: d.budgets.filter((x) => x.id !== id),
                        }
                      : d
                  )
                }
              />
            ))
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Daily spend heatmap */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div className="sec-label">Daily spend · {month}</div>
              <span className="pill">
                {daysLeft > 0 ? `${daysLeft} days left` : "Month complete"}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
              aria-label="Daily spending heatmap"
            >
              {/* Day-of-week headers */}
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 9.5,
                    color: "var(--ink-4)",
                    textAlign: "center",
                    fontFamily: "var(--f-mono)",
                    marginBottom: 2,
                  }}
                  aria-hidden
                >
                  {d}
                </div>
              ))}

              {/* Filler cells for first weekday offset */}
              {calInfo &&
                Array.from({ length: calInfo.firstWeekday }).map((_, i) => (
                  <div
                    key={`filler-${i}`}
                    style={{
                      aspectRatio: "1",
                      background: "transparent",
                    }}
                    aria-hidden
                  />
                ))}

              {/* Day cells */}
              {calInfo &&
                Array.from({ length: calInfo.numDays }).map((_, i) => {
                  const v = dailySpendHistory[i] ?? 0;
                  const max = Math.max(...dailySpendHistory);
                  const intensity = max > 0 ? v / max : 0;
                  const isToday = isCurrentMonth && i + 1 === todayDay;
                  const bg =
                    intensity > 0.75
                      ? heatmapIntensityColors[4]
                      : intensity > 0.55
                        ? heatmapIntensityColors[3]
                        : intensity > 0.3
                          ? heatmapIntensityColors[2]
                          : intensity > 0.1
                            ? heatmapIntensityColors[1]
                            : heatmapIntensityColors[0];
                  return (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: bg,
                        color:
                          intensity > 0.55
                            ? "white"
                            : intensity > 0.1
                              ? "#1c1a16"
                              : "var(--ink-2)",
                        borderRadius: 5,
                        fontFamily: "var(--f-mono)",
                        fontSize: 10,
                        border: isToday ? "1.5px solid var(--ink)" : "none",
                        fontWeight: isToday ? 700 : 400,
                      }}
                      aria-label={`Day ${i + 1}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 14,
                fontSize: 10,
                color: "var(--ink-4)",
              }}
              aria-label="Heatmap legend: less to more spending"
            >
              <span>less</span>
              {(
                [
                  "#fbf7ee",
                  "#f5edd9",
                  "#ecdfc0",
                  "#d9c098",
                  "#c96442",
                ] as const
              ).map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    background: c,
                    borderRadius: 3,
                  }}
                  aria-hidden
                />
              ))}
              <span>more</span>
            </div>
          </div>

          {/* AI Suggestion */}
          <BudgetSuggestionCard />

          {/* vs last month */}
          {vsLastMonth.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div className="sec-label" style={{ marginBottom: 12 }}>
                vs last month
              </div>
              {vsLastMonth.map((item, i) => (
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
                  <span style={{ fontSize: 12.5 }}>{item.category}</span>
                  <span
                    className="num"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color:
                        item.tone === "pos" ? "var(--pos)" : "var(--neg)",
                    }}
                  >
                    {item.deltaInCents > 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(item.deltaInCents), currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BudgetCard component
// ---------------------------------------------------------------------------

interface BudgetCardProps {
  budget: Budget;
  onUpdate: (updated: Budget) => void;
  onDelete: (id: string) => void;
}

function BudgetCard({ budget: b, onUpdate, onDelete }: BudgetCardProps) {
  const currency = useCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<"limit" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuOpen]);

  async function handleLimitSubmit() {
    if (!inputValue) return;
    setSubmitting(true);
    setActionError("");
    const result = await updateBudgetLimit(b.id, inputValue);
    if (result.success) {
      const newLimitInCents = Math.round(parseFloat(inputValue) * 100);
      onUpdate({
        ...b,
        limitInCents: newLimitInCents,
        isOver: b.spentInCents > newLimitInCents,
        percentageUsed: Math.round((b.spentInCents / newLimitInCents) * 100),
      });
      setActiveAction(null);
      setInputValue("");
      setActionError("");
    } else {
      setActionError(result.error ?? "Failed to update limit");
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    setMenuOpen(false);
    const result = await deleteBudget(b.id);
    if (result.success) {
      onDelete(b.id);
    } else {
      setActionError(result.error ?? "Failed to delete budget");
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          className="merchant-icon"
          style={{
            background: b.color + "20",
            color: b.color,
            width: 40,
            height: 40,
          }}
          aria-hidden
        >
          <Icon name={b.icon as "cart"} size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
          <div
            style={{
              fontSize: 11.5,
              color: b.isOver ? "var(--neg)" : "var(--ink-3)",
              marginTop: 2,
            }}
          >
            {b.isOver
              ? `Over by ${formatCurrency(b.spentInCents - b.limitInCents, currency)}`
              : `${formatCurrency(b.limitInCents - b.spentInCents, currency)} left`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="num"
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: b.isOver ? "var(--neg)" : "var(--ink)",
            }}
            aria-label={`Spent ${formatCurrency(b.spentInCents, currency)} of ${formatCurrency(b.limitInCents, currency)}`}
          >
            {formatCurrency(b.spentInCents, currency)}
          </div>
          <div className="num muted" style={{ fontSize: 11 }}>
            of {formatCurrency(b.limitInCents, currency)}
          </div>
        </div>

        {/* Dots button + dropdown */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            className="btn btn-icon btn-ghost"
            type="button"
            aria-label={`Options for ${b.name}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((o) => !o)}
            style={{ marginLeft: 8 }}
          >
            <Icon name="dots" size={14} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                zIndex: 50,
                minWidth: 130,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 4,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setActiveAction("limit");
                  setMenuOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 10px",
                  fontSize: 13,
                  background: "transparent",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
              >
                Edit limit
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={handleDelete}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 10px",
                  fontSize: 13,
                  background: "transparent",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  color: "#e53935",
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="bar"
        style={{ marginTop: 12 }}
        role="progressbar"
        aria-valuenow={Math.min(b.percentageUsed, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${b.name}: ${formatPercent(b.percentageUsed)} used`}
      >
        <i
          style={{
            background: b.isOver ? "var(--neg)" : b.color,
            transform: `scaleX(${Math.min(b.percentageUsed, 100) / 100})`,
          }}
        />
      </div>

      {activeAction === "limit" && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            New monthly limit ($)
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label={`New monthly limit for ${b.name}`}
            style={{
              width: 90,
              fontSize: 12,
              padding: "3px 8px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink)",
            }}
            disabled={submitting}
          />
          <button
            className="btn btn-sm btn-primary"
            type="button"
            disabled={submitting || !inputValue}
            onClick={handleLimitSubmit}
          >
            {submitting ? "…" : "Save"}
          </button>
          <button
            className="btn btn-sm"
            type="button"
            disabled={submitting}
            onClick={() => {
              setActiveAction(null);
              setInputValue("");
              setActionError("");
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {actionError && (
        <div style={{ color: "#e53935", fontSize: 11, marginTop: 6 }}>
          {actionError}
        </div>
      )}
    </div>
  );
}
