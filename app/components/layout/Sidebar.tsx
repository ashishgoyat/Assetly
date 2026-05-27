"use client";

/**
 * Sidebar — Client Component (needs usePathname for active state)
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/app/components/ui/Icon";
import { SignOutButton } from "@/app/components/layout/SignOutButton";
import type { Account } from "@/contracts/api-contracts";

interface SidebarProps {
  userName: string;
  userInitials: string;
  accounts: Account[];
}

const NAV_ITEMS = [
  { href: "/dashboard",              label: "Home",         icon: "home"     as const },
  { href: "/dashboard/transactions", label: "Transactions", icon: "list"     as const, badge: 3 },
  { href: "/dashboard/budgets",      label: "Budgets",      icon: "pie"      as const },
  { href: "/dashboard/goals",        label: "Goals",        icon: "goal"     as const },
  { href: "/dashboard/bills",        label: "Bills",        icon: "bill"     as const },
  { href: "/dashboard/insights",     label: "Insights",     icon: "sparkle"  as const },
  { href: "/dashboard/settings",     label: "Settings",     icon: "settings" as const },
];

function formatBalance(cents: number): string {
  if (Math.abs(cents) >= 10_000_000)
    return `$${(cents / 10_000_000).toFixed(1)}Cr`
  if (Math.abs(cents) >= 100_000)
    return `$${(cents / 100_000).toFixed(1)}k`
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

export default function Sidebar({ userName, userInitials, accounts }: SidebarProps) {
  const pathname = usePathname();

  // Exact match for /dashboard, prefix match for sub-routes
  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark" aria-hidden>A</div>
        <div className="brand-name">Assetly</div>
      </div>

      {/* Main navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
      </nav>

      {/* Accounts section */}
      <div className="nav-section-label">Accounts</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {accounts.map((account) => (
          <Link
            key={account.id}
            href={`/dashboard/accounts/${account.id}`}
            className={`nav-item${isActive(`/dashboard/accounts/${account.id}`) ? " active" : ""}`}
            aria-current={isActive(`/dashboard/accounts/${account.id}`) ? "page" : undefined}
          >
            <span
              className="dot"
              style={{ background: account.color, marginLeft: 4 }}
              aria-hidden
            />
            <span style={{ flex: 1 }} className="account-label">{account.name}</span>
            <span
              className="num"
              style={{ fontSize: 11, color: "var(--ink-3)" }}
            >
              {formatBalance(account.balanceInCents)}
            </span>
          </Link>
        ))}
        <button className="nav-item" aria-label="Add account" type="button">
          <span className="nav-icon">
            <Icon name="plus" size={14} />
          </span>
          <span style={{ color: "var(--ink-3)" }}>Add account</span>
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div className="div" style={{ margin: "8px 4px" }} />

      {/* User */}
      <button
        className="nav-item"
        aria-label={`${userName} — account settings`}
        type="button"
      >
        <div
          className="avatar"
          style={{ width: 26, height: 26, fontSize: 11 }}
          aria-hidden
        >
          {userInitials}
        </div>
        <span style={{ flex: 1, textAlign: "left" }} className="user-name">
          {userName}
        </span>
        <Icon name="chev" size={14} color="var(--ink-4)" />
      </button>

      {/* Sign out */}
      <SignOutButton />
    </aside>
  );
}
