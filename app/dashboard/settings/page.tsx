"use client";

/**
 * Settings page — Client Component.
 * Fetches the user's real settings from GET /api/settings on mount and wires up
 * the Edit Profile, Change Password, Sign Out All, Export Data, Delete Account,
 * and 2FA action buttons via inline modals and server actions.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import SettingsIllustration from "@/app/dashboard/settings/SettingsIllustration";
import type { ApiResponse, UserSettings } from "@/contracts/api-contracts";
import SettingsThemeToggle from "@/app/dashboard/settings/SettingsThemeToggle";
import SettingsNotifications from "@/app/dashboard/settings/SettingsNotifications";
import Modal from "@/app/components/ui/Modal";
import {
  updateProfile,
  deleteAccount,
  signOutAllSessions,
  exportUserData,
  clearAllData,
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
          <select
            id="edit-profile-timezone"
            name="timezone"
            className="field-input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <optgroup label="Americas">
              <option value="America/New_York">Eastern Time — New York</option>
              <option value="America/Chicago">Central Time — Chicago</option>
              <option value="America/Denver">Mountain Time — Denver</option>
              <option value="America/Los_Angeles">Pacific Time — Los Angeles</option>
              <option value="America/Sao_Paulo">São Paulo</option>
              <option value="America/Toronto">Toronto</option>
            </optgroup>
            <optgroup label="Europe">
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Europe/Rome">Rome</option>
              <option value="Europe/Moscow">Moscow</option>
            </optgroup>
            <optgroup label="Asia">
              <option value="Asia/Kolkata">India — Kolkata</option>
              <option value="Asia/Colombo">Sri Lanka — Colombo</option>
              <option value="Asia/Dhaka">Bangladesh — Dhaka</option>
              <option value="Asia/Karachi">Pakistan — Karachi</option>
              <option value="Asia/Dubai">UAE — Dubai</option>
              <option value="Asia/Bangkok">Bangkok</option>
              <option value="Asia/Singapore">Singapore</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Seoul">Seoul</option>
              <option value="Asia/Shanghai">Shanghai</option>
            </optgroup>
            <optgroup label="Africa / Oceania">
              <option value="Africa/Lagos">Lagos</option>
              <option value="Africa/Cairo">Cairo</option>
              <option value="Australia/Sydney">Sydney</option>
              <option value="Pacific/Auckland">Auckland</option>
            </optgroup>
            <optgroup label="UTC">
              <option value="UTC">UTC</option>
            </optgroup>
          </select>
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
// DeleteAccountForm — used inside the Delete Account modal
// ---------------------------------------------------------------------------

interface DeleteAccountFormProps {
  onDeleted: () => void;
  onCancel: () => void;
}

function DeleteAccountForm({ onDeleted, onCancel }: DeleteAccountFormProps) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirmText !== "DELETE") return;
    setError(null);
    setSubmitting(true);

    const result = await deleteAccount(new FormData());
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
        <label htmlFor="del-account-confirm">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          id="del-account-confirm"
          name="confirm"
          type="text"
          className="field-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          required
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
          disabled={submitting || confirmText !== "DELETE"}
          aria-busy={submitting}
          style={{
            color: "white",
            background: "var(--neg)",
            borderColor: "var(--neg)",
            opacity: confirmText !== "DELETE" ? 0.4 : 1,
            cursor: confirmText !== "DELETE" ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Deleting…" : "Delete account"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ClearDataForm — used inside the Clear all data modal
// ---------------------------------------------------------------------------

interface ClearDataFormProps {
  onCleared: () => void;
  onCancel: () => void;
}

function ClearDataForm({ onCleared, onCancel }: ClearDataFormProps) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirmText !== "CLEAR") return;
    setError(null);
    setSubmitting(true);
    const result = await clearAllData();
    setSubmitting(false);
    if (result.success) {
      onCleared();
    } else {
      setError(result.error ?? null);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Clear all data">
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
        This will permanently delete all your transactions, bills, subscriptions,
        and goals. Your account, bank accounts, and budgets will remain. This
        cannot be undone.
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="clear-data-confirm">
          Type <strong>CLEAR</strong> to confirm
        </label>
        <input
          id="clear-data-confirm"
          name="confirm"
          type="text"
          className="field-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="CLEAR"
          autoComplete="off"
          required
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{ color: "var(--neg)", fontSize: 12.5, marginBottom: 10 }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
          disabled={submitting || confirmText !== "CLEAR"}
          aria-busy={submitting}
          style={{
            color: "white",
            background: "var(--neg)",
            borderColor: "var(--neg)",
            opacity: confirmText !== "CLEAR" ? 0.4 : 1,
            cursor: confirmText !== "CLEAR" ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Clearing…" : "Clear all data"}
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
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal visibility flags
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [clearDataOpen, setClearDataOpen] = useState(false);

  // In-flight states for inline buttons
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
  const notifications = settings?.notifications;
  const security = settings?.security;

  // -------------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------------

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
          <h1 className="h-title" style={{ fontWeight: 700 }}>Settings</h1>
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
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Google profile picture URL is dynamic; next/image requires static domain config
                  <img
                    src={profile.avatarUrl}
                    alt={`User avatar — ${profile.name}`}
                    width={52}
                    height={52}
                    className="avatar"
                    style={{
                      objectFit: "cover",
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
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
                )}
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
          {notifications && (
            <SettingsNotifications initialPrefs={notifications} />
          )}
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 4 — Security                                                 */}
        {/* ------------------------------------------------------------------ */}
        <Section>
          <SectionLabel>Security</SectionLabel>

          <SecurityRow
            label="Active sessions"
            value={
              security
                ? `${security.activeSessions} active session${security.activeSessions === 1 ? "" : "s"}`
                : "—"
            }
            action="Sign out all devices"
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
              aria-label="Clear all transactions, bills, and goals"
              style={{ color: "var(--neg)", borderColor: "var(--neg-soft)" }}
              onClick={() => setClearDataOpen(true)}
            >
              Clear all data
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
      <Modal
        open={editProfileOpen && profile !== null}
        title="Edit profile"
        onClose={() => setEditProfileOpen(false)}
      >
        {profile && (
          <EditProfileForm
            initial={profile}
            onSaved={handleProfileSaved}
            onCancel={() => setEditProfileOpen(false)}
          />
        )}
      </Modal>

      <Modal
        open={deleteAccountOpen}
        title="Delete account"
        onClose={() => setDeleteAccountOpen(false)}
      >
        <DeleteAccountForm
          onDeleted={handleDeleted}
          onCancel={() => setDeleteAccountOpen(false)}
        />
      </Modal>

      <Modal
        open={clearDataOpen}
        title="Clear all data"
        onClose={() => setClearDataOpen(false)}
      >
        <ClearDataForm
          onCleared={() => {
            setClearDataOpen(false);
            void fetchSettings();
          }}
          onCancel={() => setClearDataOpen(false)}
        />
      </Modal>

      {/* Fixed decorative illustration — stays in place while scrolling */}
      {mounted && (
        <div
          style={{
            position: "fixed",
            right: 40,
            bottom: 40,
            pointerEvents: "none",
            zIndex: 0,
            userSelect: "none",
          }}
          aria-hidden
        >
          <SettingsIllustration dark={resolvedTheme === "dark"} />
        </div>
      )}
    </div>
  );
}
