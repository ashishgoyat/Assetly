"use client";

/**
 * NewBudgetButton — opens a modal form to create a new budget.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import Modal from "@/app/components/ui/Modal";
import { createBudget } from "@/app/dashboard/budgets/actions";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import { getCurrencySymbol } from "@/lib/format";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
] as const;

const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "cart", label: "Shopping" },
  { value: "coffee", label: "Dining/Coffee" },
  { value: "car", label: "Transport" },
  { value: "bill", label: "Bills" },
  { value: "home", label: "Housing" },
  { value: "heart", label: "Health" },
  { value: "music", label: "Entertainment" },
  { value: "bag", label: "Fashion" },
  { value: "pie", label: "Other" },
];

const COLOR_OPTIONS = [
  "#5e7d96",
  "#7b61ff",
  "#e06c2e",
  "#2e7d32",
  "#c96442",
  "#5c4e8a",
  "#b5543b",
  "#3d6b8f",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewBudgetButton() {
  const currency = useCurrency();
  const currSymbol = getCurrencySymbol(currency);
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#5e7d96");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createBudget(formData);
    if (result.success) {
      setOpen(false);
      // Trigger a re-fetch in the parent
      window.dispatchEvent(new CustomEvent("budget-created"));
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  }

  function handleOpen() {
    setSelectedColor("#5e7d96");
    setError(null);
    setOpen(true);
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    background: "var(--surface-2)",
    color: "var(--ink)",
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--ink-3)",
    marginBottom: 4,
    display: "block",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    fontWeight: 500,
  };

  return (
    <>
      <button
        className="btn btn-sm btn-primary"
        type="button"
        onClick={handleOpen}
        aria-label="Create new budget"
      >
        <Icon name="plus" size={13} /> New budget
      </button>

      <Modal open={open} title="New budget" onClose={() => setOpen(false)}>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {/* Name */}
            <div>
              <label htmlFor="budget-name" style={labelStyle}>
                Name
              </label>
              <input
                id="budget-name"
                type="text"
                name="name"
                placeholder="e.g. Groceries"
                required
                style={inputStyle}
                autoComplete="off"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="budget-category" style={labelStyle}>
                Category
              </label>
              <select
                id="budget-category"
                name="category"
                required
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly limit */}
            <div>
              <label htmlFor="budget-limit" style={labelStyle}>
                Monthly limit ({currSymbol})
              </label>
              <input
                id="budget-limit"
                type="number"
                name="limitDollars"
                placeholder="200"
                min="1"
                step="0.01"
                required
                style={inputStyle}
              />
            </div>

            {/* Icon */}
            <div>
              <label htmlFor="budget-icon" style={labelStyle}>
                Icon
              </label>
              <select
                id="budget-icon"
                name="icon"
                required
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {ICON_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <span style={labelStyle} id="budget-color-label">
                Color
              </span>
              <div
                role="radiogroup"
                aria-labelledby="budget-color-label"
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              >
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={selectedColor === color}
                    aria-label={`Color ${color}`}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: color,
                      border: `2px solid ${selectedColor === color ? "var(--ink)" : "transparent"}`,
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              <input type="hidden" name="color" value={selectedColor} />
            </div>

            {/* Submit */}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {submitting ? "Creating..." : "Create budget"}
            </button>

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{ color: "#e53935", fontSize: 12, marginTop: -6 }}
              >
                {error}
              </div>
            )}
          </form>
        </Modal>
    </>
  );
}
