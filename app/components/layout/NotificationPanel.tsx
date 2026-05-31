"use client";

import type { Notification, NotificationType } from "@/contracts/api-contracts";

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  isExiting?: boolean;
}

const TYPE_COLORS: Record<NotificationType, string> = {
  bill_due: "#e53935",
  budget_exceeded: "#f57c00",
  large_transaction: "#7b61ff",
  goal_milestone: "#2e7d32",
  weekly_digest: "var(--ink-3)",
};

function getRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function NotificationPanel({
  notifications,
  onMarkAllRead,
  isExiting = false,
}: NotificationPanelProps) {
  return (
    <div
      role="dialog"
      aria-label="Notifications"
      aria-modal="false"
      className="anim-pop"
      data-exiting={isExiting ? "true" : "false"}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 340,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg)",
        zIndex: 50,
        overflow: "hidden",
        transformOrigin: "top right",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 10px",
          borderBottom: "1px solid var(--border-2)",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          Notifications
        </span>
        <button
          type="button"
          onClick={onMarkAllRead}
          style={{
            fontSize: 12,
            color: "var(--accent)",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            padding: "2px 0",
            fontFamily: "var(--f-sans)",
            fontWeight: 500,
          }}
          aria-label="Mark all notifications as read"
        >
          Mark all read
        </button>
      </div>

      {/* Notification list */}
      <div
        style={{
          maxHeight: 380,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--ink-3)",
            }}
          >
            You&apos;re all caught up 🎉
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 16px",
                borderBottom: "1px solid var(--border-2)",
                background: notif.isRead
                  ? "transparent"
                  : "var(--surface-2)",
                borderLeft: notif.isRead
                  ? "3px solid transparent"
                  : "3px solid var(--accent)",
                transition:
                  "background var(--dur-fast) var(--ease-out-quart)",
                cursor: notif.route ? "pointer" : "default",
              }}
              role="article"
              aria-label={`${notif.title}${notif.isRead ? "" : ", unread"}`}
            >
              {/* Type dot */}
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: TYPE_COLORS[notif.type],
                  flexShrink: 0,
                  marginTop: 5,
                  display: "inline-block",
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    lineHeight: 1.35,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {notif.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {notif.body}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-4)",
                    marginTop: 4,
                  }}
                >
                  {getRelativeTime(notif.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
