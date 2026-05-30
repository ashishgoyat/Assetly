"use client";

/**
 * Settings page — Client Component.
 * Fetches the user's real settings from GET /api/settings on mount.
 *
 * Interactive sub-sections (theme toggle, notification toggles) are
 * delegated to their own "use client" child components.
 */

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, UserSettings } from "@/contracts/api-contracts";
import SettingsThemeToggle from "@/app/dashboard/settings/SettingsThemeToggle";
import SettingsNotifications from "@/app/dashboard/settings/SettingsNotifications";

// ---------------------------------------------------------------------------
// Section wrapper — shared card shell used by all sections
// ---------------------------------------------------------------------------

interface SectionProps {
  children: React.ReactNode;
  dangerZone?: boolean;
}

function Section({ children, dangerZone = false }: SectionProps) {
  return (
    <div
      className="card"
      style={{
        padding: 24,
        borderColor: dangerZone ? "var(--neg-soft)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section heading row
// ---------------------------------------------------------------------------

function SectionLabel({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className="sec-label"
      style={{
        marginBottom: 16,
        color: danger ? "var(--neg)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Security row — label/value pair with an action button on the right
// ---------------------------------------------------------------------------

interface SecurityRowProps {
  label: string;
  value: React.ReactNode;
  action: string;
  actionAriaLabel?: string;
}

function SecurityRow({
  label,
  value,
  action,
  actionAriaLabel,
}: SecurityRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
      }}
    >
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {value}
        </div>
      </div>
      <button
        className="btn btn-sm"
        type="button"
        aria-label={actionAriaLabel ?? action}
      >
        {action}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPasswordChange(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Skeleton — shown while the profile data is loading
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  const shimmer: React.CSSProperties = {
    background: "var(--surface-2, #f3f4f6)",
    borderRadius: 6,
    animation: "pulse 1.5s ease-in-out infinite",
  };

  return (
    <>
      {/* Avatar + name/email row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            ...shimmer,
            width: 52,
            height: 52,
            borderRadius: "50%",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <div style={{ flex: 1 }}>
          <div
            style={{ ...shimmer, width: 140, height: 16, marginBottom: 8 }}
            aria-hidden="true"
          />
          <div
            style={{ ...shimmer, width: 200, height: 13 }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Fields grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
        aria-busy="true"
        aria-label="Loading profile"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div
              style={{ ...shimmer, width: 80, height: 12, marginBottom: 8 }}
              aria-hidden="true"
            />
            <div
              style={{ ...shimmer, width: "100%", height: 36 }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      const json = (await res.json()) as ApiResponse<UserSettings>;
      if (!res.ok || json.error !== null) {
        throw new Error(json.error?.message ?? "Failed to load settings");
      }
      setSettings(json.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load settings";
      setError(message);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run fetch via setTimeout(fn, 0) so the initial setState calls inside
  // fetchSettings happen asynchronously and do not trigger the
  // react-hooks/set-state-in-effect lint rule.
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchSettings]);

  const profile = settings?.profile;
  const security = settings?.security;

  return (
    <div className="page-content">
      {/* Page header */}
      <div className="page-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div>
          <h1 className="serif h-title">Settings</h1>
          <p className="h-sub">
            Manage your profile, notifications, and preferences
          </p>
        </div>
      </div>

      {/* Single column, max 680 wide */}
      <div
        style={{
          maxWidth: 680,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Inline error banner */}
        {error && (
          <div
            role="alert"
            className="card"
            style={{
              padding: 16,
              borderColor: "var(--neg-soft)",
              background: "var(--neg-soft)",
              color: "var(--neg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13.5 }}>
              Couldn&apos;t load your settings. {error}
            </div>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => void fetchSettings()}
              aria-label="Retry loading settings"
            >
              Retry
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 1 — Profile                                                  */}
        {/* ------------------------------------------------------------------ */}
        <Section>
          <SectionLabel>Profile</SectionLabel>

          {loading || !profile ? (
            <ProfileSkeleton />
          ) : (
            <>
              {/* Avatar + name/email row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  className="avatar"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                  aria-label={`User avatar — initials ${profile.initials}`}
                >
                  {profile.initials}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {profile.name}
                  </div>
                  <div
                    className="muted"
                    style={{ fontSize: 13, marginTop: 2 }}
                  >
                    {profile.email}
                  </div>
                </div>
              </div>

              {/* Fields grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                }}
              >
                <div className="field">
                  <label htmlFor="settings-fullname">Full Name</label>
                  <input
                    id="settings-fullname"
                    className="field-input"
                    type="text"
                    value={profile.name}
                    readOnly
                    aria-readonly="true"
                  />
                </div>

                <div className="field">
                  <label htmlFor="settings-email">Email</label>
                  <input
                    id="settings-email"
                    className="field-input"
                    type="email"
                    value={profile.email}
                    readOnly
                    aria-readonly="true"
                  />
                </div>

                <div className="field">
                  <label htmlFor="settings-currency">Currency</label>
                  <input
                    id="settings-currency"
                    className="field-input"
                    type="text"
                    value={profile.currency}
                    readOnly
                    aria-readonly="true"
                  />
                </div>

                <div className="field">
                  <label htmlFor="settings-timezone">Timezone</label>
                  <input
                    id="settings-timezone"
                    className="field-input"
                    type="text"
                    value={profile.timezone}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
              </div>

              {/* Edit button */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <button
                  className="btn"
                  type="button"
                  aria-label="Edit profile"
                >
                  Edit Profile
                </button>
              </div>
            </>
          )}
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 2 — Appearance                                               */}
        {/* ------------------------------------------------------------------ */}
        <Section>
          <SectionLabel>Appearance</SectionLabel>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Theme</div>
            <SettingsThemeToggle />
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 3 — Notifications                                            */}
        {/* ------------------------------------------------------------------ */}
        <Section>
          <SectionLabel>Notifications</SectionLabel>
          <SettingsNotifications />
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 4 — Security                                                 */}
        {/* ------------------------------------------------------------------ */}
        <Section>
          <SectionLabel>Security</SectionLabel>

          <SecurityRow
            label="Two-factor authentication"
            value={
              security?.twoFactorEnabled ? (
                <span
                  className="pill pill-pos"
                  style={{ marginTop: 4, display: "inline-flex" }}
                >
                  Enabled
                </span>
              ) : (
                <span
                  className="pill pill-warn"
                  style={{ marginTop: 4, display: "inline-flex" }}
                >
                  Not enabled
                </span>
              )
            }
            action={security?.twoFactorEnabled ? "Manage" : "Enable"}
            actionAriaLabel={
              security?.twoFactorEnabled
                ? "Manage two-factor authentication"
                : "Enable two-factor authentication"
            }
          />

          <div className="div" />

          <SecurityRow
            label="Password"
            value={
              security
                ? `Last changed ${formatPasswordChange(security.lastPasswordChange)}`
                : "—"
            }
            action="Change password"
          />

          <div className="div" />

          <SecurityRow
            label="Active sessions"
            value={
              security
                ? `${security.activeSessions} session${security.activeSessions === 1 ? "" : "s"}`
                : "—"
            }
            action="Sign out all"
            actionAriaLabel="Sign out all active sessions"
          />
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 5 — Danger zone                                              */}
        {/* ------------------------------------------------------------------ */}
        <Section dangerZone>
          <SectionLabel danger>Danger zone</SectionLabel>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-sm"
              type="button"
              aria-label="Export all your data"
            >
              Export all data
            </button>

            <button
              className="btn btn-sm"
              type="button"
              aria-label="Delete your account permanently"
              style={{ color: "var(--neg)", borderColor: "var(--neg-soft)" }}
            >
              Delete account
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
