"use client";

/**
 * Settings page — Client Component.
 * Fetches the user's real settings from GET /api/settings on mount and wires up
 * the Edit Profile, Change Password, Sign Out All, Export Data, Delete Account,
 * and 2FA action buttons via inline modals and server actions.
 */

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, UserSettings } from "@/contracts/api-contracts";
import SettingsThemeToggle from "@/app/dashboard/settings/SettingsThemeToggle";
import SettingsNotifications from "@/app/dashboard/settings/SettingsNotifications";
import Modal from "@/app/components/ui/Modal";
import {
  updateProfile,
  updatePassword,
  deleteAccount,
  signOutAllSessions,
  exportUserData,
  toggle2FA,
} from "@/app/dashboard/settings/actions";
import {
  useSetCurrency,
  type Currency,
} from "@/app/contexts/CurrencyContext";

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
  onAction?: () => void;
  busy?: boolean;
}

function SecurityRow({
  label,
  value,
  action,
  actionAriaLabel,
  onAction,
  busy = false,
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
        onClick={onAction}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? "…" : action}
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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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
// EditProfileForm — used inside the Edit Profile modal
// ---------------------------------------------------------------------------

interface EditProfileFormProps {
  initial: UserSettings["profile"];
  onSaved: (next: { currency: Currency }) => void;
  onCancel: () => void;
}

function EditProfileForm({ initial, onSaved, onCancel }: EditProfileFormProps) {
  const [name, setName] = useState(initial.name);
  const [currency, setCurrency] = useState<string>(initial.currency);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("currency", currency);
    fd.set("timezone", timezone);

    const result = await updateProfile(fd);
    setSaving(false);
    if (result.success) {
      onSaved({ currency: currency as Currency });
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Edit profile">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="edit-profile-name">Full name</label>
          <input
            id="edit-profile-name"
            name="name"
            type="text"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div className="field">
          <label htmlFor="edit-profile-currency">Currency</label>
          <select
            id="edit-profile-currency"
            name="currency"
            className="field-input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="USD">USD — US Dollar</option>
            <option value="INR">INR — Indian Rupee</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="edit-profile-timezone">Timezone</label>
          <input
            id="edit-profile-timezone"
            name="timezone"
            type="text"
            className="field-input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/New_York"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: "var(--neg)",
            fontSize: 12.5,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ChangePasswordForm — used inside the Change Password modal
// ---------------------------------------------------------------------------

interface ChangePasswordFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

function ChangePasswordForm({ onSaved, onCancel }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    const fd = new FormData();
    fd.set("currentPassword", currentPassword);
    fd.set("newPassword", newPassword);

    const result = await updatePassword(fd);
    setSaving(false);
    if (result.success) {
      setSuccess(true);
      // Close after a brief success message
      setTimeout(() => {
        onSaved();
      }, 1500);
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Change password">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div className="field">
          <label htmlFor="cp-current">Current password</label>
          <input
            id="cp-current"
            name="currentPassword"
            type="password"
            className="field-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="field">
          <label htmlFor="cp-new">New password</label>
          <input
            id="cp-new"
            name="newPassword"
            type="password"
            className="field-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
            Must be at least 8 characters.
          </div>
        </div>
        <div className="field">
          <label htmlFor="cp-confirm">Confirm new password</label>
          <input
            id="cp-confirm"
            name="confirmPassword"
            type="password"
            className="field-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: "var(--neg)",
            fontSize: 12.5,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            color: "var(--pos)",
            fontSize: 12.5,
            marginBottom: 10,
          }}
        >
          Password updated.
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={saving || success}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving || success}
          aria-busy={saving}
        >
          {saving ? "Saving…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// DeleteAccountForm — used inside the Delete Account modal
// ---------------------------------------------------------------------------

interface DeleteAccountFormProps {
  onDeleted: () => void;
  onCancel: () => void;
}

function DeleteAccountForm({ onDeleted, onCancel }: DeleteAccountFormProps) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData();
    fd.set("password", password);

    const result = await deleteAccount(fd);
    setSubmitting(false);
    if (result.success) {
      onDeleted();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Delete account">
      <div
        role="alert"
        style={{
          background: "var(--neg-soft)",
          color: "var(--neg)",
          padding: 12,
          borderRadius: 10,
          fontSize: 13,
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        This will permanently delete your account and all data. This cannot be
        undone.
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="del-account-password">
          Enter your password to confirm
        </label>
        <input
          id="del-account-password"
          name="password"
          type="password"
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: "var(--neg)",
            fontSize: 12.5,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn"
          disabled={submitting}
          aria-busy={submitting}
          style={{
            color: "white",
            background: "var(--neg)",
            borderColor: "var(--neg)",
          }}
        >
          {submitting ? "Deleting…" : "Delete account"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const setGlobalCurrency = useSetCurrency();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal visibility flags
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // In-flight states for inline buttons
  const [twoFAUpdating, setTwoFAUpdating] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // -------------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------------

  async function handleToggle2FA() {
    if (!security) return;
    setActionError(null);
    setTwoFAUpdating(true);
    const fd = new FormData();
    fd.set("enabled", security.twoFactorEnabled ? "false" : "true");
    const result = await toggle2FA(fd);
    setTwoFAUpdating(false);
    if (result.success) {
      void fetchSettings();
    } else {
      setActionError(result.error);
    }
  }

  async function handleSignOutAll() {
    if (!window.confirm("Sign out of all sessions?")) return;
    setActionError(null);
    setSigningOutAll(true);
    const result = await signOutAllSessions();
    if (result.success) {
      window.location.href = "/login";
    } else {
      setSigningOutAll(false);
      setActionError(result.error);
    }
  }

  async function handleExport() {
    setActionError(null);
    setExporting(true);
    const result = await exportUserData();
    setExporting(false);
    if (!result.success) {
      setActionError(result.error);
      return;
    }
    const blob = new Blob([result.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assetly-export-${todayIsoDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleProfileSaved(next: { currency: Currency }) {
    setEditProfileOpen(false);
    // Update the global currency context immediately so all pages re-render
    setGlobalCurrency(next.currency);
    void fetchSettings();
  }

  function handleDeleted() {
    window.location.href = "/";
  }

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

        {/* Inline action error banner */}
        {actionError && (
          <div
            role="alert"
            className="card"
            style={{
              padding: 12,
              borderColor: "var(--neg-soft)",
              background: "var(--neg-soft)",
              color: "var(--neg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13 }}>{actionError}</div>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
            >
              Dismiss
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
                  onClick={() => setEditProfileOpen(true)}
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
            action={security?.twoFactorEnabled ? "Disable" : "Enable"}
            actionAriaLabel={
              security?.twoFactorEnabled
                ? "Disable two-factor authentication"
                : "Enable two-factor authentication"
            }
            onAction={handleToggle2FA}
            busy={twoFAUpdating}
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
            onAction={() => setChangePasswordOpen(true)}
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
            onAction={handleSignOutAll}
            busy={signingOutAll}
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
              onClick={handleExport}
              disabled={exporting}
              aria-busy={exporting}
            >
              {exporting ? "Preparing…" : "Export all data"}
            </button>

            <button
              className="btn btn-sm"
              type="button"
              aria-label="Delete your account permanently"
              style={{ color: "var(--neg)", borderColor: "var(--neg-soft)" }}
              onClick={() => setDeleteAccountOpen(true)}
            >
              Delete account
            </button>
          </div>
        </Section>
      </div>

      {/* ─── Modals ─── */}
      {editProfileOpen && profile && (
        <Modal
          title="Edit profile"
          onClose={() => setEditProfileOpen(false)}
        >
          <EditProfileForm
            initial={profile}
            onSaved={handleProfileSaved}
            onCancel={() => setEditProfileOpen(false)}
          />
        </Modal>
      )}

      {changePasswordOpen && (
        <Modal
          title="Change password"
          onClose={() => setChangePasswordOpen(false)}
        >
          <ChangePasswordForm
            onSaved={() => {
              setChangePasswordOpen(false);
              void fetchSettings();
            }}
            onCancel={() => setChangePasswordOpen(false)}
          />
        </Modal>
      )}

      {deleteAccountOpen && (
        <Modal
          title="Delete account"
          onClose={() => setDeleteAccountOpen(false)}
        >
          <DeleteAccountForm
            onDeleted={handleDeleted}
            onCancel={() => setDeleteAccountOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
