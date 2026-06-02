"use client";

import { useState, useTransition } from "react";
import Icon from "@/app/components/ui/Icon";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import { payBill, skipBill, toggleBillAutoPay } from "@/app/dashboard/home-actions";
import type { Bill } from "@/contracts/api-contracts";

interface Props {
  bill: Bill;
  onPaid?: (id: string) => void;
  onSkipped?: (id: string) => void;
}

export default function BillRow({ bill: b, onPaid, onSkipped }: Props) {
  const currency = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [autoPay, setAutoPay] = useState(b.isAutoPay);

  function handlePay() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", b.id);
      const res = await payBill(fd);
      if (res.success) {
        onPaid?.(b.id);
      } else {
        setError(res.error);
      }
    });
  }

  function handleSkip() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", b.id);
      const res = await skipBill(fd);
      if (res.success) {
        onSkipped?.(b.id);
      } else {
        setError(res.error);
      }
    });
  }

  function handleToggleAutoPay() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", b.id);
      const res = await toggleBillAutoPay(fd);
      if (res.success) {
        setAutoPay((prev) => !prev);
      } else {
        setError(res.error);
      }
    });
  }

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
            {autoPay ? (
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

      <div
        className="anim-collapsible"
        data-open={expanded ? "true" : "false"}
        aria-hidden={!expanded}
      >
        <div className="anim-collapsible-inner">
          <div style={{ padding: "6px 0 8px 52px" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}
              aria-busy={isPending}
            >
              {!autoPay && (
                <button
                  className="btn btn-sm btn-primary"
                  type="button"
                  disabled={isPending}
                  onClick={handlePay}
                >
                  Pay now
                </button>
              )}
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                disabled={isPending}
                onClick={handleToggleAutoPay}
              >
                {autoPay ? "Disable auto-pay" : "Enable auto-pay"}
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                style={{ color: "var(--ink-3)" }}
                disabled={isPending}
                onClick={handleSkip}
              >
                Skip this month
              </button>
            </div>
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
