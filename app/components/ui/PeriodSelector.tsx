"use client";

/**
 * PeriodSelector — Client Component
 * Renders a row of period toggle buttons (e.g. "1W", "1M", "3M").
 * Tracks the active selection in local state.
 * Currently UI-only — no data refetch until backend endpoints support period params.
 */

import { useState } from "react";

interface PeriodSelectorProps {
  periods: string[];
  defaultIndex?: number;
}

export default function PeriodSelector({
  periods,
  defaultIndex = 0,
}: PeriodSelectorProps) {
  const [active, setActive] = useState(defaultIndex);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {periods.map((p, i) => (
        <button
          key={p}
          className="btn btn-sm btn-ghost"
          style={{
            background: active === i ? "var(--bg-soft)" : undefined,
            fontWeight: active === i ? 600 : 400,
          }}
          type="button"
          aria-pressed={active === i}
          onClick={() => setActive(i)}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
