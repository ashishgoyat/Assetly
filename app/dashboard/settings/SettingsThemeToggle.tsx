"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { applyThemeWithTransition } from "@/app/lib/applyThemeWithTransition";

type ThemeOption = "light" | "system" | "dark";

const OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
];

// useSyncExternalStore-based mount detection avoids the
// useEffect+setState pattern that triggers react-hooks/set-state-in-effect.
function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},           // subscribe — no external store to listen to
    () => true,               // getSnapshot (client)
    () => false,              // getServerSnapshot
  );
}

export default function SettingsThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  // Avoid hydration mismatch — render a neutral skeleton until mounted
  if (!mounted) {
    return (
      <div
        style={{ display: "flex", gap: 4 }}
        aria-label="Theme selector"
        role="group"
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className="btn btn-sm"
            type="button"
            disabled
            aria-label={`${opt.label} theme`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  const active = (theme as ThemeOption | undefined) ?? "system";

  return (
    <div
      style={{ display: "flex", gap: 4 }}
      aria-label="Theme selector"
      role="group"
    >
      {OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            className="btn btn-sm"
            type="button"
            aria-pressed={isActive}
            aria-label={`${opt.label} theme`}
            onClick={() => applyThemeWithTransition(setTheme, opt.value)}
            style={
              isActive
                ? { background: "var(--ink)", color: "var(--surface)" }
                : undefined
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
