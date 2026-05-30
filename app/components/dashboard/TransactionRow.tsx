"use client";

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import MerchantIcon from "@/app/components/ui/MerchantIcon";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import type { Transaction } from "@/contracts/api-contracts";

export default function TransactionRow({ tx: r }: { tx: Transaction }) {
  const currency = useCurrency();
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        className="tx-row"
        style={{ width: "100%", textAlign: "left" }}
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((o) => !o)}
      >
        <MerchantIcon name={r.merchant} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.merchant}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {r.category} · {r.date}, {r.time}
          </div>
        </div>
        <div
          className="num"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: r.type === "income" ? "var(--pos)" : "var(--ink)",
          }}
        >
          {r.type === "income" ? "+" : "−"}
          {formatCurrency(r.amountInCents, currency)}
        </div>
        <Icon name={expanded ? "chevd" : "chev"} size={14} color="var(--ink-4)" />
      </button>

      {expanded && (
        <div style={{ display: "flex", gap: 6, padding: "6px 0 8px 52px", flexWrap: "wrap" }}>
          <button className="btn btn-sm btn-ghost" type="button">
            <Icon name="list" size={11} /> Categorize
          </button>
          <button className="btn btn-sm btn-ghost" type="button">
            <Icon name="info" size={11} /> Add note
          </button>
          <button className="btn btn-sm btn-ghost" type="button">
            Split
          </button>
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            style={{ color: "var(--ink-3)" }}
          >
            Exclude
          </button>
        </div>
      )}
    </div>
  );
}
