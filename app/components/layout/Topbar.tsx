"use client";

/**
 * Topbar — Client Component (search input, notifications, and keyboard shortcuts need client)
 */

import { useState, useEffect, useRef } from "react";
import Icon from "@/app/components/ui/Icon";
import DarkModeToggle from "@/app/components/ui/DarkModeToggle";
import HamburgerButton from "@/app/components/layout/HamburgerButton";
import SearchDropdown from "@/app/components/layout/SearchDropdown";
import NotificationPanel from "@/app/components/layout/NotificationPanel";
import type { Account, Notification } from "@/contracts/api-contracts";

interface TopbarProps {
  userName: string;
  userInitials: string;
  accounts: Account[];
}

export default function Topbar({ userName, userInitials, accounts }: TopbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapperRef = useRef<HTMLDivElement>(null);

  // Fetch notifications once on mount
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d: { data?: Notification[] }) => {
        if (d.data) setNotifications(d.data);
      })
      .catch(() => {
        // Silently fail — notification fetch is non-critical
      });
  }, []);

  // Click outside notification panel to close
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        notifWrapperRef.current &&
        !notifWrapperRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [notifOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <header className="topbar" role="banner">
      {/* Hamburger — only visible on mobile via .hamburger CSS class */}
      <HamburgerButton
        userName={userName}
        userInitials={userInitials}
        accounts={accounts}
      />

      {/* Search bar wrapping the SearchDropdown */}
      <div className="search" role="search">
        <Icon name="search" size={15} color="var(--ink-3)" />
        <SearchDropdown inputRef={searchInputRef} />
        <span className="kbd" aria-label="Keyboard shortcut Command K">⌘K</span>
      </div>

      <div style={{ flex: 1 }} />

      <DarkModeToggle />

      {/* Bell button + notification panel */}
      <div
        ref={notifWrapperRef}
        style={{ position: "relative", display: "inline-flex" }}
      >
        <button
          className="btn btn-icon btn-ghost"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          aria-expanded={notifOpen}
          aria-haspopup="dialog"
          type="button"
          onClick={() => setNotifOpen((prev) => !prev)}
          style={{ position: "relative" }}
        >
          <Icon name="bell" size={16} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#e53935",
                border: "1.5px solid var(--surface)",
                display: "block",
              }}
            />
          )}
        </button>

        {notifOpen && (
          <NotificationPanel
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
          />
        )}
      </div>

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
