"use client";

/**
 * MobileDrawer — Client Component
 * Slide-in navigation drawer for mobile viewports (< 768px).
 * Renders the same nav as Sidebar inside a fixed overlay.
 */

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/app/components/ui/Icon";

const NAV_ITEMS = [
  { href: "/dashboard",              label: "Home",         icon: "home"    as const },
  { href: "/dashboard/transactions", label: "Transactions", icon: "list"    as const, badge: 3 },
  { href: "/dashboard/budgets",      label: "Budgets",      icon: "pie"     as const },
  { href: "/dashboard/goals",        label: "Goals",        icon: "goal"    as const },
  { href: "/dashboard/bills",        label: "Bills",        icon: "bill"    as const },
  { href: "/dashboard/insights",     label: "Insights",     icon: "sparkle" as const },
];

const ACCOUNT_ITEMS = [
  { href: "/dashboard/accounts/chase",  label: "Chase Checking", sub: "$3,247", color: "var(--cat-6)" },
  { href: "/dashboard/accounts/ally",   label: "Ally Savings",   sub: "$5,173", color: "var(--cat-2)" },
  { href: "/dashboard/accounts/broker", label: "Brokerage",      sub: "$14.2k", color: "var(--cat-4)" },
];

interface MobileDrawerProps {
  onClose: () => void;
}

export default function MobileDrawer({ onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav className="drawer sidebar" aria-label="Mobile navigation">
        {/* Brand + close */}
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">A</div>
          <div className="brand-name">Assetly</div>
          <button
            className="btn btn-icon btn-ghost"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
            aria-label="Close menu"
            type="button"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Main navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive(item.href) ? " active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={16} stroke={1.7} />
              </span>
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="nav-badge" aria-label={`${item.badge} pending`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Accounts section */}
        <div className="nav-section-label">Accounts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ACCOUNT_ITEMS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`nav-item${isActive(a.href) ? " active" : ""}`}
              aria-current={isActive(a.href) ? "page" : undefined}
            >
              <span
                className="dot"
                style={{ background: a.color, marginLeft: 4 }}
                aria-hidden="true"
              />
              <span style={{ flex: 1 }}>{a.label}</span>
              <span className="num" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {a.sub}
              </span>
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Divider */}
        <div className="div" style={{ margin: "8px 4px" }} />

        {/* User */}
        <button
          className="nav-item"
          aria-label="Maya Jensen — account settings"
          type="button"
        >
          <div
            className="avatar"
            style={{ width: 26, height: 26, fontSize: 11 }}
            aria-hidden="true"
          >
            MJ
          </div>
          <span style={{ flex: 1, textAlign: "left" }}>Maya Jensen</span>
          <Icon name="chev" size={14} color="var(--ink-4)" />
        </button>
      </nav>
    </>
  );
}
