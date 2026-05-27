"use client";

/**
 * BarChart — Client Component
 * Simple SVG vertical bar chart.
 */

interface BarDatum {
  v: number;
  label?: string;
  highlight?: boolean;
}

interface BarChartProps {
  data: BarDatum[];
  w?: number;
  h?: number;
  accent?: string;
  muted?: string;
  highlight?: number[];
}

export default function BarChart({
  data,
  w = 600,
  h = 160,
  accent = "var(--accent)",
  muted = "var(--bg-soft)",
  highlight = [],
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.v));
  const bw = (w - 8) / data.length;

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
      aria-hidden
    >
      {data.map((d, i) => {
        const bh = (d.v / max) * (h - 28);
        const x = i * bw + 4;
        const y = h - bh - 18;
        const isHigh = highlight.includes(i) || d.highlight;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bw - 6}
              height={bh}
              rx="3"
              fill={isHigh ? accent : muted}
            />
            {d.label && (
              <text
                x={x + (bw - 6) / 2}
                y={h - 4}
                textAnchor="middle"
                fontFamily="var(--f-mono)"
                fontSize="9.5"
                fill="var(--ink-4)"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
