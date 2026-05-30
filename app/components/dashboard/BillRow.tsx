"use client";

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import type { Bill } from "@/contracts/api-contracts";

export default function BillRow({ bill: b }: { bill: Bill }) {
  const currency = useCurrency();
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        className="tx-row"
        style={{ gridTemplateColumns: "44px 1fr auto", width: "100%", textAlign: "left" }}
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((o) => !o)}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: b.isUrgent ? "var(--accent)" : "var(--bg-soft)",
            color: b.isUrgent ? "white" : "var(--ink-2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label={b.dueDate}
        >
          <span style={{ fontSize: 9, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.85 }}>
            {b.dueDate.split(" ")[0]}
          </span>
          <span className="num" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
            {b.dueDate.split(" ")[1]}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{b.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            {b.isAutoPay ? (
              <>
                <Icon name="check" size={10} color="var(--pos)" />
                Auto-pay
              </>
            ) : (
              <span style={{ color: "var(--accent-2)" }}>Needs scheduling</span>
            )}
            <span className="dim">·</span>
            <span>in {b.dueInDays} {b.dueInDays === 1 ? "day" : "days"}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{formatCurrency(b.amountInCents, currency)}</span>
          <Icon name={expanded ? "chevd" : "chev"} size={12} color="var(--ink-4)" />
        </div>
      </button>

      {expanded && (
        <div style={{ display: "flex", gap: 6, padding: "6px 0 8px 52px", flexWrap: "wrap" }}>
          {!b.isAutoPay && (
            <button className="btn btn-sm btn-primary" type="button">
              Pay now
            </button>
          )}
          {!b.isAutoPay && (
            <button className="btn btn-sm btn-ghost" type="button">
              Schedule
            </button>
          )}
          {b.isAutoPay && (
            <button className="btn btn-sm btn-ghost" type="button">
              Edit auto-pay
            </button>
          )}
          <button className="btn btn-sm btn-ghost" type="button">
            View history
          </button>
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            style={{ color: "var(--ink-3)" }}
          >
            Skip this month
          </button>
        </div>
      )}
    </div>
  );
}
