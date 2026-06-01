"use client";

/**
 * PeriodSelector — Client Component
 * Renders a row of period toggle buttons (e.g. "1W", "1M", "3M").
 * Tracks the active selection in local state.
 * Calls onChange when the user picks a period so the parent can re-fetch data.
 */

import { useState } from "react";

interface PeriodSelectorProps {
  periods: string[];
  defaultIndex?: number;
  onChange?: (period: string) => void;
}

export default function PeriodSelector({
  periods,
  defaultIndex = 0,
  onChange,
}: PeriodSelectorProps) {
  const [active, setActive] = useState(defaultIndex);

  function handleSelect(i: number) {
    setActive(i);
    onChange?.(periods[i]);
  }

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
          onClick={() => handleSelect(i)}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
