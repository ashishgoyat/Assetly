"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import Icon from "@/app/components/ui/Icon";
import { applyThemeWithTransition } from "@/app/lib/applyThemeWithTransition";

// useSyncExternalStore-based mount detection avoids the
// useEffect+setState pattern that triggers react-hooks/set-state-in-effect.
function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <button className="btn btn-icon btn-ghost" aria-label="Toggle dark mode" disabled>
        <Icon name="moon" size={16} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="btn btn-icon btn-ghost"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => applyThemeWithTransition(setTheme, isDark ? "light" : "dark")}
    >
      <Icon name={isDark ? "sun" : "moon"} size={16} />
    </button>
  );
}
