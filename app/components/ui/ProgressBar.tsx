/**
 * ProgressBar — Server Component
 */

interface ProgressBarProps {
  /** 0–100+ (clamped to 100 visually) */
  percent: number;
  color?: string;
  variant?: "default" | "danger" | "success";
  size?: "sm" | "lg";
}

export default function ProgressBar({
  percent,
  color,
  variant = "default",
  size = "sm",
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const variantClass =
    variant === "danger"
      ? "danger"
      : variant === "success"
        ? "success"
        : "";

  return (
    <div className={`bar ${size === "lg" ? "lg" : ""} ${variantClass}`.trim()}>
      <i
        style={{
          transform: `scaleX(${clamped / 100})`,
          background: color ?? undefined,
        }}
        aria-hidden
      />
    </div>
  );
}
