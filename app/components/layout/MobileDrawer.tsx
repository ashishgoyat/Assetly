"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/app/components/ui/Icon";
import { signOutAction } from "@/app/components/layout/sign-out-action";
import Modal from "@/app/components/ui/Modal";
import AddAccountForm from "@/app/components/forms/AddAccountForm";
import { useExitAnimation, MOTION_MS } from "@/app/hooks/useExitAnimation";
import { useCurrency, useExchangeRate } from "@/app/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/contracts/api-contracts";

const NAV_ITEMS = [
  { href: "/dashboard",              label: "Home",         icon: "home"     as const },
  { href: "/dashboard/transactions", label: "Transactions", icon: "list"     as const },
  { href: "/dashboard/budgets",      label: "Budgets",      icon: "pie"      as const },
  { href: "/dashboard/goals",        label: "Goals",        icon: "goal"     as const },
  { href: "/dashboard/bills",        label: "Bills",        icon: "bill"     as const },
  { href: "/dashboard/settings",     label: "Settings",     icon: "settings" as const },
];

interface MobileDrawerProps {
  onClose: () => void;
  userName: string;
  userInitials: string;
  userAvatarUrl: string;
  accounts: Account[];
}

export default function MobileDrawer({
  onClose,
  userName,
  userInitials,
  userAvatarUrl,
  accounts,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const currency = useCurrency();
  const rate = useExchangeRate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menu = useExitAnimation(menuOpen, MOTION_MS.fast);
  const didMount = useRef(true);

  // Close on route change (skip mount)
  useEffect(() => {
    if (didMount.current) {
      didMount.current = false;
      return;
    }
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

  // Click outside user menu to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Lock the .page scroll container (not body — overflow:hidden on body breaks
  // position:fixed on iOS Safari because it creates a scroll context).
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".page");
    if (!page) return;
    const prev = page.style.overflow;
    page.style.overflow = "hidden";
    return () => { page.style.overflow = prev; };
  }, []);

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return createPortal(
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />

      {/* Drawer — mirrors Sidebar layout */}
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
            </Link>
          ))}
        </div>

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
              // eslint-disable-next-line @next/next/no-img-element -- Google profile picture URL is dynamic
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
              style={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", flexDirection: "column", gap: 1 }}
              className="user-name"
            >
              <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>{userName}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.2 }}>Free plan</span>
            </span>
          </button>
        </div>
      </nav>
    </>,
    document.body
  );
}
