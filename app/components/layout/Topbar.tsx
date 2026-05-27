"use client";

/**
 * Topbar — Client Component (search input needs client)
 */

import Icon from "@/app/components/ui/Icon";
import DarkModeToggle from "@/app/components/ui/DarkModeToggle";
import HamburgerButton from "@/app/components/layout/HamburgerButton";
import type { Account } from "@/contracts/api-contracts";

interface TopbarProps {
  userName: string;
  userInitials: string;
  accounts: Account[];
}

export default function Topbar({ userName, userInitials, accounts }: TopbarProps) {
  return (
    <header className="topbar" role="banner">
      {/* Hamburger — only visible on mobile via .hamburger CSS class */}
      <HamburgerButton
        userName={userName}
        userInitials={userInitials}
        accounts={accounts}
      />
      <div className="search" role="search">
        <Icon name="search" size={15} color="var(--ink-3)" />
        <input
          type="search"
          placeholder="Search transactions, merchants, categories…"
          aria-label="Search"
        />
        <span className="kbd" aria-label="Keyboard shortcut Command K">⌘K</span>
      </div>

      <div style={{ flex: 1 }} />

      <DarkModeToggle />
      <button
        className="btn btn-icon btn-ghost"
        aria-label="Notifications"
        type="button"
      >
        <Icon name="bell" size={16} />
      </button>
      <button
        className="btn btn-icon btn-ghost"
        aria-label="Settings"
        type="button"
      >
        <Icon name="settings" size={16} />
      </button>
    </header>
  );
}
