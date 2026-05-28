"use client";

/**
 * SavingsOpportunityCard — Client Component
 * Handles the dismiss interaction for the "Save money" insight on the bills page.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import { formatCurrency } from "@/lib/format";

interface SavingsOpportunityCardProps {
  savingsOpportunityInCents: number;
  savingsOpportunityNote?: string;
  unusedSubNames: string[];
}

export default function SavingsOpportunityCard({
  savingsOpportunityInCents,
  savingsOpportunityNote,
  unusedSubNames,
}: SavingsOpportunityCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const note =
    savingsOpportunityNote ??
    (unusedSubNames.length > 0
      ? `You haven't used ${unusedSubNames.join(" and ")}. Cancel to save ${formatCurrency(savingsOpportunityInCents)}/mo.`
      : "");

  return (
    <div
      className="card"
      style={{
        padding: 18,
        background:
          "linear-gradient(180deg, var(--accent-tint), var(--surface) 80%)",
        borderColor: "var(--accent-soft)",
      }}
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden
        >
          <Icon name="info" size={14} stroke={2} />
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            alignSelf: "center",
          }}
        >
          Save {formatCurrency(savingsOpportunityInCents)}/mo
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.5,
        }}
      >
        {note}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <a href="#subscriptions" className="btn btn-sm btn-accent">
          Review subs
        </a>
        <button
          className="btn btn-sm btn-ghost"
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Keep all subscriptions and dismiss this suggestion"
        >
          Keep all
        </button>
      </div>
    </div>
  );
}
