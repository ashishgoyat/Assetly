/**
 * Settings page — Server Component outer shell.
 * Interactive sub-sections (theme toggle, notification toggles) are
 * delegated to "use client" components.
 *
 * No API call yet — fully static UI.
 * TODO: replace with GET /api/settings once the endpoint is live.
 */

import type { Metadata } from "next";
import SettingsThemeToggle from "@/app/dashboard/settings/SettingsThemeToggle";
import SettingsNotifications from "@/app/dashboard/settings/SettingsNotifications";

export const metadata: Metadata = {
  title: "Settings — Assetly",
};

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
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
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
        {/* ------------------------------------------------------------------ */}
        {/* Section 1 — Profile                                                  */}
        {/* ------------------------------------------------------------------ */}
        <Section>
          <SectionLabel>Profile</SectionLabel>

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
              style={{ width: 52, height: 52, fontSize: 18, flexShrink: 0 }}
              aria-label="User avatar — initials AG"
            >
              AG
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Ashish Goyat</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                goyatashish07@gmail.com
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
                defaultValue="Ashish Goyat"
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
                defaultValue="goyatashish07@gmail.com"
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
                defaultValue="USD"
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
                defaultValue="Asia/Kolkata"
                readOnly
                aria-readonly="true"
              />
            </div>
          </div>

          {/* Edit button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn" type="button" aria-label="Edit profile">
              Edit Profile
            </button>
          </div>
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
              <span className="pill pill-warn" style={{ marginTop: 4, display: "inline-flex" }}>
                Not enabled
              </span>
            }
            action="Enable"
            actionAriaLabel="Enable two-factor authentication"
          />

          <div className="div" />

          <SecurityRow
            label="Password"
            value="Last changed Jan 2025"
            action="Change password"
          />

          <div className="div" />

          <SecurityRow
            label="Active sessions"
            value="1 session"
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
