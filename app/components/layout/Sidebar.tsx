"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/app/components/ui/Icon";
import { signOutAction } from "@/app/components/layout/sign-out-action";
import Modal from "@/app/components/ui/Modal";
import AddAccountForm from "@/app/components/forms/AddAccountForm";
import { useSidebar } from "@/app/components/layout/SidebarContext";
import { useExitAnimation, MOTION_MS } from "@/app/hooks/useExitAnimation";
import { useCurrency, useExchangeRate } from "@/app/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/contracts/api-contracts";

interface SidebarProps {
  userName: string;
  userInitials: string;
  userAvatarUrl: string;
  accounts: Account[];
}

type NavItem = {
  href: string
  label: string
  icon: "home" | "list" | "pie" | "goal" | "bill" | "sparkle" | "settings"
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",              label: "Home",         icon: "home"     },
  { href: "/dashboard/transactions", label: "Transactions", icon: "list"     },
  { href: "/dashboard/budgets",      label: "Budgets",      icon: "pie"      },
  { href: "/dashboard/goals",        label: "Goals",        icon: "goal"     },
  { href: "/dashboard/bills",        label: "Bills",        icon: "bill"     },
  { href: "/dashboard/settings",     label: "Settings",     icon: "settings" },
];

export default function Sidebar({ userName, userInitials, userAvatarUrl, accounts }: SidebarProps) {
  const pathname = usePathname();
  const currency = useCurrency();
  const rate = useExchangeRate();
  const { collapsed, toggle } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menu = useExitAnimation(menuOpen, MOTION_MS.fast);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Exact match for /dashboard, prefix match for sub-routes
  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className={`sidebar${collapsed ? " sidebar-icon-only" : ""}`} aria-label="Main navigation">
      {/* Brand */}
      <div className="brand">
        {!collapsed && <div className="brand-mark" aria-hidden>A</div>}
        <div className="brand-name">Assetly</div>
        <button
          className="btn btn-icon btn-ghost sidebar-toggle"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
          style={{ marginLeft: "auto" }}
        >
          <Icon name="sidebar" size={16} />
        </button>
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
      <Link
        href="/dashboard/accounts"
        className={`nav-section-label${isActive("/dashboard/accounts") ? " active" : ""}`}
        style={{ textDecoration: "none" }}
      >
        Accounts
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {accounts.map((account) => (
          <Link
            key={account.id}
            href={`/dashboard/accounts/${account.id}`}
            className={`nav-item${isActive(`/dashboard/accounts/${account.id}`) ? " active" : ""}`}
            aria-current={isActive(`/dashboard/accounts/${account.id}`) ? "page" : undefined}
            style={{ alignItems: "center", padding: "8px 10px" }}
          >
            {/* Colored dot */}
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: account.color,
                flexShrink: 0,
                display: "inline-block",
              }}
              aria-hidden
            />
            {/* Account name — single line */}
            <span
              className="account-label"
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12.5,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {account.name}
            </span>
            <span
              className="account-label num"
              style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}
            >
              {formatCurrency(account.balanceInCents, currency, rate)}
            </span>
          </Link>
        ))}
        {!collapsed && (
          <button
            className="nav-item"
            aria-label="Add account"
            type="button"
            onClick={() => setAddAccountOpen(true)}
          >
            <span className="nav-icon">
              <Icon name="plus" size={14} />
            </span>
            <span style={{ color: "var(--ink-3)" }}>Add account</span>
          </button>
        )}
      </div>

      <Modal
        open={addAccountOpen}
        title="Add account"
        onClose={() => setAddAccountOpen(false)}
      >
        <AddAccountForm onClose={() => setAddAccountOpen(false)} />
      </Modal>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div className="div" style={{ margin: "8px 4px" }} />

      {/* User row with 3-dots menu */}
      <div ref={menuRef} style={{ position: "relative" }}>
        {menu.shouldRender && (
          <div
            className="anim-pop"
            data-exiting={menu.isExiting ? "true" : "false"}
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              zIndex: 50,
              transformOrigin: "bottom center",
            }}
          >
            <form action={signOutAction}>
              <button
                type="submit"
                className="nav-item"
                style={{ width: "100%", color: "#e53935" }}
                aria-label="Sign out of Assetly"
              >
                <span className="nav-icon">
                  <Icon name="logout" size={14} color="#e53935" />
                </span>
                <span>Sign out</span>
              </button>
            </form>
          </div>
        )}
        <button
          className="nav-item"
          aria-label={`${userName} — open menu`}
          aria-expanded={menuOpen}
          type="button"
          style={{ width: "100%" }}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Google profile picture URL is dynamic; next/image requires static domain config
            <img
              src={userAvatarUrl}
              alt={userInitials}
              width={26}
              height={26}
              className="avatar"
              style={{ objectFit: "cover", borderRadius: "50%" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="avatar"
              style={{ width: 26, height: 26, fontSize: 11 }}
              aria-hidden
            >
              {userInitials}
            </div>
          )}
          <span
            style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", gap: 1 }}
            className="user-name"
          >
            <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>{userName}</span>
            <span style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.2 }}>Free plan</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
