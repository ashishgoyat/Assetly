"use client";

/**
 * Topbar — Client Component (search input, notifications, and keyboard shortcuts need client)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/app/components/ui/Icon";
import DarkModeToggle from "@/app/components/ui/DarkModeToggle";
import HamburgerButton from "@/app/components/layout/HamburgerButton";
import SearchDropdown from "@/app/components/layout/SearchDropdown";
import NotificationPanel from "@/app/components/layout/NotificationPanel";
import { useExitAnimation, MOTION_MS } from "@/app/hooks/useExitAnimation";
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
  const notif = useExitAnimation(notifOpen, MOTION_MS.fast);
  const seenNotifIds = useRef<Set<string>>(new Set());
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  const fetchNotifications = useCallback(async (showToast: boolean) => {
    try {
      const res = await fetch("/api/notifications");
      const d: { data?: Notification[] } = await res.json();
      if (!d.data) return;
      const newNotifs = d.data;

      if (showToast) {
        const TYPE_PRIORITY: Record<string, number> = {
          bill_due: 0,
          budget_exceeded: 1,
          large_transaction: 2,
          goal_milestone: 3,
          weekly_digest: 4,
        };
        const brandNew = newNotifs
          .filter((n) => !n.isRead && !seenNotifIds.current.has(n.id))
          .sort((a, b) => (TYPE_PRIORITY[a.type] ?? 9) - (TYPE_PRIORITY[b.type] ?? 9));
        if (brandNew.length > 0) {
          setToast({ title: brandNew[0].title, body: brandNew[0].body });
        }
      }

      newNotifs.forEach((n) => seenNotifIds.current.add(n.id));
      setNotifications(newNotifs);
    } catch {
      // non-critical — badge stays at last known count
    }
  }, []); // seenNotifIds is a ref (stable), setNotifications/setToast are stable setters

  // Initial fetch on mount (no toast — avoids showing stale notifications as "new")
  useEffect(() => {
    void fetchNotifications(false);
  }, [fetchNotifications]);

  // Poll every 30 seconds — show toast if new unread notifications arrive
  useEffect(() => {
    const interval = setInterval(() => void fetchNotifications(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Re-fetch when the panel opens (keep existing behaviour, no toast)
  useEffect(() => {
    if (!notifOpen) return;
    void fetchNotifications(false);
  }, [notifOpen, fetchNotifications]);

  // Listen for custom event dispatched by mutation forms (e.g. after createTransaction)
  useEffect(() => {
    function handleRefresh() {
      // Small delay so the server action has time to persist before we re-fetch
      setTimeout(() => void fetchNotifications(true), 800);
    }
    window.addEventListener("assetly:notifications-refresh", handleRefresh);
    return () => window.removeEventListener("assetly:notifications-refresh", handleRefresh);
  }, [fetchNotifications]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

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
    const ids = notifications.map((n) => n.id);
    // Optimistically mark all as read locally
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    // Persist to API
    fetch("/api/notifications/read-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).catch(() => {
      // Non-critical — local state already updated
    });
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

        {notif.shouldRender && (
          <NotificationPanel
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            isExiting={notif.isExiting}
          />
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className="anim-slide-in-right"
          style={{
            position: "fixed",
            top: 68,
            right: 20,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxWidth: "min(320px, calc(100vw - 2rem))",
            width: "max-content",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }}>
            <Icon name="bell" size={15} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
              {toast.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 3,
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {toast.body}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-4)",
              padding: 2,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      )}
    </header>
  );
}
