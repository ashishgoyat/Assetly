"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Icon from "@/app/components/ui/Icon";

export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon name={isDark ? "sun" : "moon"} size={16} />
    </button>
  );
}
