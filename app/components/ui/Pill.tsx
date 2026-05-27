/**
 * Pill — Server Component
 * Badge/tag component for categories and status indicators.
 */

interface PillProps {
  children: React.ReactNode;
  variant?: "default" | "pos" | "neg" | "warn" | "accent";
  className?: string;
}

export default function Pill({
  children,
  variant = "default",
  className = "",
}: PillProps) {
  const variantClass =
    variant === "pos"
      ? "pill-pos"
      : variant === "neg"
        ? "pill-neg"
        : variant === "warn"
          ? "pill-warn"
          : variant === "accent"
            ? "pill-accent"
            : "";

  return (
    <span className={`pill ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
