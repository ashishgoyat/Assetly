"use client";

/**
 * QuickAddFab — floating action button fixed to the bottom-right of the
 * dashboard area. Opens a small menu of quick-add options; each option
 * triggers the appropriate form inside a Modal.
 */

import { useState, useRef, useEffect } from "react";
import Modal from "@/app/components/ui/Modal";
import AddTransactionForm from "@/app/components/forms/AddTransactionForm";
import NewGoalForm from "@/app/components/forms/NewGoalForm";
import AddBillForm from "@/app/components/forms/AddBillForm";
import { createBudget } from "@/app/dashboard/budgets/actions";
import { createSubscription } from "@/app/dashboard/bills/actions";
import { useExitAnimation, MOTION_MS } from "@/app/hooks/useExitAnimation";
import type { TransactionCategory } from "@/contracts/api-contracts";

// ── Types ────────────────────────────────────────────────────────────────────

type FormType = "transaction" | "goal" | "bill" | "budget" | "subscription";

// ── Constants ─────────────────────────────────────────────────────────────────

const MENU_ITEMS: { type: FormType; label: string; color: string }[] = [
  { type: "transaction", label: "Transaction", color: "#6b8f71" },
  { type: "goal",        label: "Goal",        color: "#5e7d96" },
  { type: "bill",        label: "Bill",        color: "#c97b55" },
  { type: "budget",      label: "Budget",      color: "#8b7ec8" },
  { type: "subscription", label: "Subscription", color: "#6b8f8f" },
];

const TRANSACTION_CATEGORIES: TransactionCategory[] = [
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

const ICON_OPTIONS = [
  "home",
  "goal",
  "bill",
  "pie",
  "list",
  "sparkle",
  "settings",
] as const;

const COLOR_OPTIONS = [
  "#6b8f71",
  "#5e7d96",
  "#c97b55",
  "#8b7ec8",
  "#c9955b",
  "#6b8f8f",
] as const;

// ── Inline Budget Form ────────────────────────────────────────────────────────

function BudgetForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Groceries");
  const [limit, setLimit] = useState("");
  const [icon, setIcon] = useState<string>("home");
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("category", category);
      fd.set("limitDollars", limit);
      fd.set("icon", icon);
      fd.set("color", color);
      const result = await createBudget(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("[BudgetForm] unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Name */}
        <div className="field">
          <label htmlFor="fab-budget-name">Name</label>
          <input
            id="fab-budget-name"
            type="text"
            className="field-input"
            placeholder="e.g. Groceries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            autoComplete="off"
          />
        </div>

        {/* Category */}
        <div className="field">
          <label htmlFor="fab-budget-category">Category</label>
          <select
            id="fab-budget-category"
            className="field-input"
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
          >
            {TRANSACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly limit */}
        <div className="field">
          <label htmlFor="fab-budget-limit">Monthly limit</label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-3)",
                fontSize: 14,
                pointerEvents: "none",
              }}
              aria-hidden
            >
              $
            </span>
            <input
              id="fab-budget-limit"
              type="number"
              className="field-input"
              placeholder="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="0"
              step="any"
              required
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Icon */}
        <div className="field">
          <label htmlFor="fab-budget-icon">Icon</label>
          <select
            id="fab-budget-icon"
            className="field-input"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          >
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="field">
          <span className="field-group-label">Color</span>
          <div style={{ display: "flex", gap: 8 }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "2.5px solid var(--ink)" : "2.5px solid transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                  outline: color === c ? "2px solid var(--surface)" : "none",
                  outlineOffset: -4,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {error !== null && (
        <div className="field-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={pending}
          aria-busy={pending}
          style={{ minWidth: 130 }}
        >
          {pending ? "Creating…" : "Create budget"}
        </button>
      </div>
    </form>
  );
}

// ── Inline Subscription Form ──────────────────────────────────────────────────

function SubscriptionForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [icon, setIcon] = useState<string>("sparkle");
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("amountDollars", amount);
      fd.set("nextDate", nextDate);
      fd.set("icon", icon);
      fd.set("color", color);
      const result = await createSubscription(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("[SubscriptionForm] unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Name */}
        <div className="field">
          <label htmlFor="fab-sub-name">Name</label>
          <input
            id="fab-sub-name"
            type="text"
            className="field-input"
            placeholder="e.g. Netflix"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoComplete="off"
          />
        </div>

        {/* Amount per month */}
        <div className="field">
          <label htmlFor="fab-sub-amount">Amount per month</label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-3)",
                fontSize: 14,
                pointerEvents: "none",
              }}
              aria-hidden
            >
              $
            </span>
            <input
              id="fab-sub-amount"
              type="number"
              className="field-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              required
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Next billing date */}
        <div className="field">
          <label htmlFor="fab-sub-next">Next billing date</label>
          <input
            id="fab-sub-next"
            type="date"
            className="field-input"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            required
          />
        </div>

        {/* Icon */}
        <div className="field">
          <label htmlFor="fab-sub-icon">Icon</label>
          <select
            id="fab-sub-icon"
            className="field-input"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          >
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="field">
          <span className="field-group-label">Color</span>
          <div style={{ display: "flex", gap: 8 }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "2.5px solid var(--ink)" : "2.5px solid transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                  outline: color === c ? "2px solid var(--surface)" : "none",
                  outlineOffset: -4,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {error !== null && (
        <div className="field-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={pending}
          aria-busy={pending}
          style={{ minWidth: 150 }}
        >
          {pending ? "Adding…" : "Add subscription"}
        </button>
      </div>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function QuickAddFab() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<FormType | null>(null);
  const fabRef = useRef<HTMLDivElement>(null);
  const menu = useExitAnimation(menuOpen, MOTION_MS.fast);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function closeAll() {
    setActiveForm(null);
    setMenuOpen(false);
  }

  function handleMenuItemClick(type: FormType) {
    setActiveForm(type);
    setMenuOpen(false);
  }

  return (
    <>
      {/* FAB + menu container */}
      <div
        ref={fabRef}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {/* Quick-add menu */}
        {menu.shouldRender && (
          <div
            className="anim-scale-in"
            data-exiting={menu.isExiting ? "true" : "false"}
            style={{
              position: "absolute",
              bottom: 64,
              right: 0,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
              minWidth: 180,
              transformOrigin: "bottom right",
            }}
            role="menu"
            aria-label="Quick add"
          >
            {MENU_ITEMS.map((item) => (
              <button
                key={item.type}
                type="button"
                role="menuitem"
                className="nav-item"
                onClick={() => handleMenuItemClick(item.type)}
                style={{ width: "100%", gap: 10 }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* FAB button */}
        <button
          type="button"
          className="press-feedback"
          aria-label={menuOpen ? "Close quick-add menu" : "Open quick-add menu"}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "var(--ink)",
            color: "var(--surface)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
            transition:
              "transform var(--dur-fast) var(--ease-out-quart), box-shadow var(--dur-fast) var(--ease-out-quart)",
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{
              transition: "transform var(--dur-fast) var(--ease-out-quart)",
              transform: menuOpen ? "rotate(45deg)" : "rotate(0deg)",
            }}
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Modals */}
      <Modal open={activeForm === "transaction"} title="Add transaction" onClose={closeAll}>
        <AddTransactionForm onClose={closeAll} />
      </Modal>

      <Modal open={activeForm === "goal"} title="New goal" onClose={closeAll}>
        <NewGoalForm onClose={closeAll} />
      </Modal>

      <Modal open={activeForm === "bill"} title="Add bill" onClose={closeAll}>
        <AddBillForm onClose={closeAll} />
      </Modal>

      <Modal open={activeForm === "budget"} title="New budget" onClose={closeAll}>
        <BudgetForm onClose={closeAll} />
      </Modal>

      <Modal open={activeForm === "subscription"} title="Add subscription" onClose={closeAll}>
        <SubscriptionForm onClose={closeAll} />
      </Modal>
    </>
  );
}
