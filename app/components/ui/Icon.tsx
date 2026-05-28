/**
 * Icon — Server Component
 * SVG icon system ported from components.jsx.
 */

export type IconName =
  | "home"
  | "list"
  | "pie"
  | "goal"
  | "bill"
  | "spark"
  | "bank"
  | "bell"
  | "search"
  | "plus"
  | "arrow"
  | "chev"
  | "chevd"
  | "check"
  | "x"
  | "settings"
  | "sparkle"
  | "trend"
  | "card"
  | "cal"
  | "flag"
  | "coffee"
  | "cart"
  | "car"
  | "play"
  | "music"
  | "bag"
  | "arrowUp"
  | "arrowDown"
  | "arrowR"
  | "dots"
  | "eye"
  | "filter"
  | "info"
  | "download"
  | "refresh"
  | "lock"
  | "heart"
  | "sun"
  | "moon"
  | "sidebar";

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
}

export default function Icon({
  name,
  size = 18,
  stroke = 1.6,
  color,
  className,
}: IconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: color || "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v10h14V10" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h12M8 12h12M8 18h12" />
        <circle cx="4" cy="6" r="0.6" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="0.6" fill="currentColor" stroke="none" />
        <circle cx="4" cy="18" r="0.6" fill="currentColor" stroke="none" />
      </>
    ),
    pie: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5v8.5H20.5" />
      </>
    ),
    goal: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    bill: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    spark: (
      <path d="M12 3l1.6 5 5.4.7-4 3.8 1 5.5-4-2.8-4 2.8 1-5.5-4-3.8 5.4-.7z" />
    ),
    bank: (
      <>
        <path d="M3 10l9-6 9 6" />
        <path d="M5 10v9M9 10v9M15 10v9M19 10v9" />
        <path d="M3 21h18" />
      </>
    ),
    bell: (
      <>
        <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" />
        <path d="M10 21a2 2 0 004 0" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.3-4.3" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    chev: <path d="m9 6 6 6-6 6" />,
    chevd: <path d="m6 9 6 6 6-6" />,
    check: <path d="m5 12 5 5L20 7" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    sparkle: (
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    ),
    trend: (
      <>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    cal: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </>
    ),
    flag: <path d="M5 21V4M5 4l10 2-2 4 2 4-10 2" />,
    coffee: (
      <>
        <path d="M3 9h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9z" />
        <path d="M16 11h2a2 2 0 010 4h-2" />
        <path d="M7 3v3M11 3v3" />
      </>
    ),
    cart: (
      <>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="17" cy="20" r="1.5" />
        <path d="M3 4h2l2.5 11h11l2-8H6" />
      </>
    ),
    car: (
      <>
        <path d="M5 17h14M7 17v-5l2-5h6l2 5v5M5 12h14" />
        <circle cx="8" cy="17" r="1.5" />
        <circle cx="16" cy="17" r="1.5" />
      </>
    ),
    play: (
      <path d="m7 4 14 8L7 20z" fill="currentColor" stroke="none" />
    ),
    music: (
      <>
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="16" r="2.5" />
        <path d="M8.5 18V5l12-2v13" />
      </>
    ),
    bag: (
      <>
        <path d="M5 9h14l-1 11H6L5 9z" />
        <path d="M9 9V6a3 3 0 016 0v3" />
      </>
    ),
    arrowUp: <path d="M7 14l5-5 5 5" />,
    arrowDown: <path d="M7 10l5 5 5-5" />,
    arrowR: <path d="M14 6l6 6-6 6M4 12h16" />,
    dots: (
      <>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    filter: <path d="M3 5h18M6 12h12M10 19h4" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8.5h.01M11 12h1v5h1" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v13M6 13l6 6 6-6M4 21h16" />
      </>
    ),
    refresh: (
      <>
        <path d="M4 4v6h6M20 20v-6h-6" />
        <path d="M20 10A8 8 0 0 0 6 7M4 14a8 8 0 0 0 14 3" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    heart: (
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </>
    ),
    moon: (
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    ),
    sidebar: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name] ?? null}</svg>;
}
