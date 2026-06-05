"use client";

/**
 * DonutChart — Client Component
 * SVG strokeDasharray donut with center label.
 */

interface DonutSegment {
  v: number;
  c: string;
  label?: string;
}

interface DonutChartProps {
  segs: DonutSegment[];
  size?: number;
  strokeW?: number;
  label?: string;
  sub?: string;
  gap?: number;
  dark?: boolean;
}

export default function DonutChart({
  segs,
  size = 140,
  strokeW = 18,
  label,
  sub,
  gap = 2,
  dark,
}: DonutChartProps) {
  const total = segs.reduce((s, x) => s + x.v, 0);
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;

  // Pre-compute offsets outside of render — avoids mutating a variable inside map
  const computedSegs = segs.map((s, i) => {
    const prevTotal = segs.slice(0, i).reduce((sum, prev) => sum + prev.v, 0);
    const prevAcc = total > 0 ? (prevTotal / total) * circumference : 0;
    const len = total > 0 ? (s.v / total) * circumference - gap : 0;
    return { ...s, len, off: circumference - prevAcc };
  });

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      aria-label={label ? `Donut chart: ${label}` : "Donut chart"}
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.15)" : "var(--border-2)"}
          strokeWidth={strokeW}
        />
        {computedSegs.map((s, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.c}
            strokeWidth={strokeW}
            strokeDasharray={`${Math.max(0, s.len)} ${circumference}`}
            strokeDashoffset={s.off}
            strokeLinecap="butt"
          />
        ))}
      </svg>

      {label && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <div
            className="num"
            style={{
              fontSize: size * 0.22,
              fontWeight: 700,
              lineHeight: 1,
              color: dark ? "#FFFFFF" : undefined,
            }}
          >
            {label}
          </div>
          {sub && (
            <div
              style={{
                fontSize: 10,
                color: dark ? "rgba(255,255,255,0.5)" : "var(--ink-3)",
                marginTop: 4,
              }}
            >
              {sub}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
