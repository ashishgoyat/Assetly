"use client";

import { useState } from "react";
import AreaChart from "@/app/components/charts/AreaChart";
import Icon from "@/app/components/ui/Icon";
import { useFormatCurrency } from "@/app/contexts/CurrencyContext";

type Period = "1W" | "1M" | "3M" | "1Y";

interface Props {
  totalInCents: number;
  weekDeltaInCents: number;
  cashFlowDataByPeriod: Record<Period, number[]>;
  cashFlowLabelsByPeriod: Record<Period, string[]>;
}

const PERIODS: Period[] = ["1W", "1M", "3M", "1Y"];

export default function CashOnHandCard({
  totalInCents,
  weekDeltaInCents,
  cashFlowDataByPeriod,
  cashFlowLabelsByPeriod,
}: Props) {
  const { fmtCompact } = useFormatCurrency();
  const [period, setPeriod] = useState<Period>("1M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="card" style={{ padding: 22, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="sec-label">Cash on hand</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
            <span className="serif num" style={{ fontSize: 44, lineHeight: 1 }}>
              {fmtCompact(totalInCents)}
            </span>
            <span className="pill pill-pos">
              <Icon name="arrowUp" size={11} />
              {fmtCompact(weekDeltaInCents)} this week
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
        <div style={{ height: 20, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          {hoveredIndex != null ? (
            <span className="num" style={{ fontSize: 13.5, fontWeight: 600 }}>
              {fmtCompact(cashFlowDataByPeriod[period][hoveredIndex])}
            </span>
          ) : null}
        </div>
        <AreaChart
          data={cashFlowDataByPeriod[period]}
          h={150}
          color="var(--accent)"
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
        />
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
        {cashFlowLabelsByPeriod[period].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
