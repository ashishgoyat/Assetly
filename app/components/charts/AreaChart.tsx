"use client";

/**
 * AreaChart — Client Component
 * Smooth bezier area chart with gradient fill and end marker.
 */

import { useMemo, useId } from "react";

interface AreaChartProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  axis?: boolean;
  padX?: number;
  hoveredIndex?: number | null;
  onHover?: (index: number | null) => void;
}

export default function AreaChart({
  data,
  w = 600,
  h = 180,
  color = "var(--accent)",
  axis = true,
  padX = 4,
  hoveredIndex,
  onHover,
}: AreaChartProps) {
  const gradId = useId().replace(/:/g, "");

  function handleMouseMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * w;
    const innerW = w - padX * 2;
    const raw = Math.round((vx - padX) / (innerW / (data.length - 1)));
    const clamped = Math.max(0, Math.min(data.length - 1, raw));
    onHover?.(clamped);
  }

  const { pts, path, areaPath } = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const innerW = w - padX * 2;

    const pts = data.map((v, i) => {
      const x = padX + (i / (data.length - 1)) * innerW;
      const y = h - 26 - ((v - min) / range) * (h - 52) - 8;
      return [x, y] as [number, number];
    });

    // Smooth bezier curve
    let path = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0[0] + p1[0]) / 2;
      path += ` C ${cx} ${p0[1]}, ${cx} ${p1[1]}, ${p1[0]} ${p1[1]}`;
    }

    const areaPath =
      path +
      ` L ${pts[pts.length - 1][0]} ${h - 22} L ${pts[0][0]} ${h - 22} Z`;

    return { pts, path, areaPath };
  }, [data, w, h, padX]);

  const last = pts[pts.length - 1];

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {axis &&
        [0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={padX}
            x2={w - padX}
            y1={(h - 22) * p + 8}
            y2={(h - 22) * p + 8}
            stroke="var(--border-2)"
            strokeDasharray="2 4"
          />
        ))}

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End marker */}
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="8" fill={color} opacity="0.18" />

      {/* Crosshair and hovered dot */}
      {hoveredIndex != null && (
        <>
          <line
            x1={pts[hoveredIndex][0]}
            x2={pts[hoveredIndex][0]}
            y1={8}
            y2={h - 22}
            stroke="var(--ink-3)"
            strokeWidth={1}
            strokeDasharray="3 3"
            pointerEvents="none"
          />
          <circle
            cx={pts[hoveredIndex][0]}
            cy={pts[hoveredIndex][1]}
            r={5}
            fill={color}
            pointerEvents="none"
          />
          <circle
            cx={pts[hoveredIndex][0]}
            cy={pts[hoveredIndex][1]}
            r={10}
            fill={color}
            opacity={0.2}
            pointerEvents="none"
          />
        </>
      )}

      {/* Transparent overlay for mouse tracking */}
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill="transparent"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onHover?.(null)}
      />
    </svg>
  );
}
