"use client";

import { useState } from "react";
import { formatCompact } from "@/lib/format";
import type { Goal } from "@/contracts/api-contracts";

export default function GoalCard({ goal: g }: { goal: Goal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card-flat"
      style={{ padding: 14, cursor: "pointer" }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((o) => !o)}
      onKeyDown={(e) => e.key === "Enter" && setExpanded((o) => !o)}
    >
      <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>{g.name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
        <span className="num serif" style={{ fontSize: 22, lineHeight: 1 }}>
          {formatCompact(g.currentInCents)}
        </span>
        <span className="num" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          / {formatCompact(g.targetInCents)}
        </span>
      </div>
      <div className="bar">
        <i style={{ transform: `scaleX(${g.percentageComplete / 100})` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
        <span style={{ color: "var(--accent-2)", fontWeight: 600 }}>{g.percentageComplete}%</span>
        <span style={{ color: "var(--ink-3)" }}>ETA {g.eta}</span>
      </div>

      {expanded && (
        <div
          style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="btn btn-sm btn-primary" type="button">
            Add funds
          </button>
          <button className="btn btn-sm btn-ghost" type="button">
            Adjust monthly
          </button>
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            style={{ color: "var(--ink-3)" }}
          >
            Pause
          </button>
        </div>
      )}
    </div>
  );
}
