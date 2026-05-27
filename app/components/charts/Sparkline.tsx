"use client";

/**
 * Sparkline — Client Component
 * Mini polyline chart with optional filled area and end dot.
 */

interface SparklineProps {
  data: readonly number[];
  w?: number;
  h?: number;
  color?: string;
  filled?: boolean;
}

export default function Sparkline({
  data,
  w = 80,
  h = 28,
  color = "var(--pos)",
  filled,
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as [number, number];
  });

  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

  const areaD = d + ` L ${w} ${h} L 0 ${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      width={w}
      height={h}
      style={{ overflow: "visible" }}
      aria-hidden
    >
      {filled && (
        <path d={areaD} fill={color} opacity="0.12" />
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}
