"use client";

import { useState } from "react";
import AreaChart from "@/app/components/charts/AreaChart";
import Icon from "@/app/components/ui/Icon";
import { useFormatCurrency } from "@/app/contexts/CurrencyContext";

type Period = "1W" | "1M" | "3M" | "1Y";

interface AccountSummary {
  name: string;
  color: string;
  balanceInCents: number;
}

interface Props {
  dark?: boolean;
  totalInCents: number;
  weekDeltaInCents: number;
  cashFlowDataByPeriod: Record<Period, number[]>;
  cashFlowLabelsByPeriod: Record<Period, string[]>;
  accounts?: AccountSummary[];
}

const PERIODS: Period[] = ["1W", "1M", "3M", "1Y"];

export default function CashOnHandCard({
  dark,
  totalInCents,
  weekDeltaInCents,
  cashFlowDataByPeriod,
  cashFlowLabelsByPeriod,
  accounts,
}: Props) {
  const { fmtCompact } = useFormatCurrency();
  const [period, setPeriod] = useState<Period>("1M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={dark ? "card-dark" : "card"} style={{ padding: 22, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {dark ? (
            <div
              className="sec-label"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Net worth
            </div>
          ) : (
            <div className="sec-label">Cash on hand</div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
            <span
              className="num"
              style={{ fontSize: 44, lineHeight: 1, fontWeight: 700, color: dark ? "#FFFFFF" : undefined }}
            >
              {fmtCompact(totalInCents)}
            </span>
            {dark ? (
              <span
                className="pill"
                style={{ background: "rgba(34,197,94,0.2)", color: "#22C55E" }}
              >
                <Icon name="arrowUp" size={11} />
                {fmtCompact(weekDeltaInCents)} this week
              </span>
            ) : (
              <span className="pill pill-pos">
                <Icon name="arrowUp" size={11} />
                {fmtCompact(weekDeltaInCents)} this week
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              className="btn btn-sm btn-ghost"
              style={{
                background: period === p
                  ? (dark ? "rgba(255,255,255,0.15)" : "var(--bg-soft)")
                  : undefined,
                fontWeight: period === p ? 600 : 400,
                color: dark ? (period === p ? "#fff" : "rgba(255,255,255,0.5)") : undefined,
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
            <span
              className="num"
              style={{ fontSize: 13.5, fontWeight: 600, color: dark ? "#fff" : undefined }}
            >
              {fmtCompact(cashFlowDataByPeriod[period][hoveredIndex])}
            </span>
          ) : null}
        </div>
        <AreaChart
          data={cashFlowDataByPeriod[period]}
          h={150}
          color={dark ? "#22C55E" : "var(--accent)"}
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
          color: dark ? "rgba(255,255,255,0.4)" : "var(--ink-4)",
          marginTop: 4,
          padding: "0 4px",
        }}
      >
        {cashFlowLabelsByPeriod[period].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      {/* Account breakdown — shown only on dark variant */}
      {dark && accounts && accounts.length > 0 && (
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
          }}
        >
          {accounts.map((a) => (
            <div
              key={a.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: a.color,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                {a.name.length > 10 ? a.name.slice(0, 10) + "…" : a.name}
              </span>
              <span
                className="num"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: a.balanceInCents < 0 ? "#EF4444" : "rgba(255,255,255,0.8)",
                }}
              >
                {fmtCompact(a.balanceInCents)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
