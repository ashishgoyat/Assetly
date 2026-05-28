"use client";

import { useState } from "react";
import AreaChart from "@/app/components/charts/AreaChart";
import Icon from "@/app/components/ui/Icon";
import { formatCompact } from "@/lib/format";

type Period = "1W" | "1M" | "3M" | "1Y";

interface Props {
  totalInCents: number;
  weekDeltaInCents: number;
  cashFlowDataByPeriod: Record<Period, number[]>;
}

const PERIODS: Period[] = ["1W", "1M", "3M", "1Y"];

const DATE_LABELS: Record<Period, string[]> = {
  "1W": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
  "1M": ["Apr 1", "Apr 8", "Apr 15", "Apr 22", "Today"],
  "3M": ["Feb", "Mar 1", "Mar 15", "Apr 1", "Today"],
  "1Y": ["May", "Jul", "Sep", "Nov", "Today"],
};

export default function CashOnHandCard({ totalInCents, weekDeltaInCents, cashFlowDataByPeriod }: Props) {
  const [period, setPeriod] = useState<Period>("1M");

  return (
    <div className="card" style={{ padding: 22, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="sec-label">Cash on hand</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
            <span className="serif num" style={{ fontSize: 44, lineHeight: 1 }}>
              {formatCompact(totalInCents)}
            </span>
            <span className="pill pill-pos">
              <Icon name="arrowUp" size={11} />
              {formatCompact(weekDeltaInCents)} this week
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              className="btn btn-sm btn-ghost"
              style={{
                background: period === p ? "var(--bg-soft)" : undefined,
                fontWeight: period === p ? 600 : 400,
              }}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <AreaChart data={cashFlowDataByPeriod[period]} h={150} color="var(--accent)" />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--f-mono)",
          fontSize: 10.5,
          color: "var(--ink-4)",
          marginTop: 4,
          padding: "0 4px",
        }}
      >
        {DATE_LABELS[period].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
