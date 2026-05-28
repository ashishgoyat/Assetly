"use client";

/**
 * BudgetSuggestionCard — Client Component
 * AI suggestion card on the budgets page with "Update budget" and "Dismiss" actions.
 * Currently UI-only for the Update action — no backend endpoint for budget edits yet.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";

export default function BudgetSuggestionCard() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="card"
      style={{
        padding: 18,
        borderColor: "var(--accent-soft)",
        background: "var(--accent-tint)",
      }}
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: "var(--accent)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden
        >
          <Icon name="sparkle" size={13} stroke={2} />
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--accent-2)",
            alignSelf: "center",
          }}
        >
          Suggestion
        </div>
      </div>
      <div
        style={{
          fontSize: 13.5,
          lineHeight: 1.5,
          color: "var(--ink-2)",
        }}
      >
        Based on your last 3 months, your dining budget should be{" "}
        <span style={{ color: "var(--accent-2)", fontWeight: 600 }}>
          $270
        </span>{" "}
        — not $200.
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {/* TODO: wire to a budget-edit action when backend supports PATCH /api/budgets/[id] */}
        <button
          className="btn btn-sm btn-accent"
          type="button"
          aria-label="Update dining budget to $270"
        >
          Update budget
        </button>
        <button
          className="btn btn-sm btn-ghost"
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss this suggestion"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
