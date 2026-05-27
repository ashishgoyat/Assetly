"use client";

import { useTheme } from "next-themes";
import Icon from "@/app/components/ui/Icon";

export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="btn btn-icon btn-ghost"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      suppressHydrationWarning
    >
      {/* Icon swaps after hydration — suppressHydrationWarning prevents mismatch warning */}
      <Icon name={isDark ? "sun" : "moon"} size={16} />
    </button>
  );
}
