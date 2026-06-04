"use client";

/**
 * Accounts index page — /dashboard/accounts
 * Lists all accounts for the current user with inline edit/delete actions.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import Modal from "@/app/components/ui/Modal";
import AddAccountForm from "@/app/components/forms/AddAccountForm";
import type { Account } from "@/contracts/api-contracts";
import { useFormatCurrency } from "@/app/contexts/CurrencyContext";
import { updateAccountAction, deleteAccountAction } from "@/app/dashboard/accounts/actions";

// ---------------------------------------------------------------------------
// AccountCard
// ---------------------------------------------------------------------------

const TYPE_LABEL: Record<Account["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  investment: "Investment",
  cash: "Cash",
};

function AccountCard({
  account,
  onUpdate,
  onDelete,
}: {
  account: Account;
  onUpdate: (updated: Account) => void;
  onDelete: (id: string) => void;
}) {
  const { fmt } = useFormatCurrency();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(account.name);
  const [editBalance, setEditBalance] = useState(
    String(account.balanceInCents / 100)
  );
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function startEdit(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditName(account.name);
    setEditBalance(String(account.balanceInCents / 100));
    setEditError(null);
    setEditing(true);
  }

  function cancelEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(false);
    setEditError(null);
  }

  async function saveEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setSaving(true);
    setEditError(null);

    const fd = new FormData();
    fd.set("id", account.id);
    fd.set("name", editName);
    fd.set("balanceDollars", editBalance);

    const result = await updateAccountAction(fd);
    setSaving(false);

    if (result.success) {
      setEditing(false);
      const newBalanceInCents = Math.round(parseFloat(editBalance) * 100);
      onUpdate({ ...account, name: editName, balanceInCents: newBalanceInCents });
    } else {
      setEditError(result.error);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${account.name}"? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    const result = await deleteAccountAction(account.id);
    if (result.success) {
      onDelete(account.id);
    } else {
      setDeleting(false);
      window.alert(result.error);
    }
  }

  const cardBody = (
    <article
      className={`card${editing ? "" : " card-hoverable"}`}
      style={{ padding: 20, position: "relative" }}
      aria-label={`${account.name} ${account.number}`}
    >
      {/* Color swatch + header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: account.color,
            flexShrink: 0,
          }}
          aria-hidden
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {account.name}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {account.number}
          </div>
        </div>
        {/* Type badge */}
        <span
          className="pill"
          style={{ fontSize: 11, flexShrink: 0 }}
        >
          {TYPE_LABEL[account.type]}
        </span>
      </div>

      {/* Balance */}
      <div
        style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}
        className="serif num"
      >
        {fmt(account.balanceInCents)}
      </div>

      {/* Inline edit panel */}
      <div
        className="anim-collapsible"
        data-open={editing ? "true" : "false"}
        aria-hidden={!editing}
      >
        <div className="anim-collapsible-inner">
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid var(--border-2)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor={`edit-name-${account.id}`} style={{ fontSize: 11 }}>
                Account name
              </label>
              <input
                id={`edit-name-${account.id}`}
                type="text"
                className="field-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                style={{ fontSize: 13 }}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor={`edit-balance-${account.id}`} style={{ fontSize: 11 }}>
                Balance ($)
              </label>
              <input
                id={`edit-balance-${account.id}`}
                type="number"
                className="field-input"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
                min="0"
                step="any"
                style={{ fontSize: 13 }}
              />
            </div>
            {editError !== null && (
              <div style={{ color: "var(--neg)", fontSize: 11 }} role="alert">
                {editError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={saving}
                aria-busy={saving}
                onClick={saveEdit}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={saving}
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action row — always visible */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid var(--border-2)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <button
          type="button"
          className="btn btn-sm"
          onClick={startEdit}
          disabled={deleting}
          aria-label={`Edit ${account.name}`}
        >
          <Icon name="settings" size={12} /> Edit
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={deleting}
          aria-busy={deleting}
          onClick={handleDelete}
          aria-label={`Delete ${account.name}`}
          style={{
            marginLeft: "auto",
            color: "var(--neg)",
            borderColor: "var(--neg-soft)",
            background: "var(--neg-soft)",
          }}
        >
          <Icon name="trash" size={12} /> {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </article>
  );

  // When not editing, wrap the main card body in a Link so clicking it navigates
  return editing ? (
    cardBody
  ) : (
    <Link
      href={`/dashboard/accounts/${account.id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
      tabIndex={-1}
      aria-label={`View details for ${account.name} ${account.number}`}
    >
      {cardBody}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      className="card skeleton"
      style={{ height: 160, borderRadius: 16 }}
      aria-hidden
    />
  );
}

// ---------------------------------------------------------------------------
// AccountsPage
// ---------------------------------------------------------------------------

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(false);
      try {
        const res = await fetch("/api/accounts", { cache: "no-store" });
        const json = (await res.json()) as
          | { data: Account[]; error: null }
          | { data: null; error: { message: string } };
        if (cancelled) return;
        if (json.error) throw new Error(json.error.message);
        setAccounts(json.data);
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  function handleUpdate(updated: Account) {
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  function handleDelete(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  function handleAccountAdded() {
    setAddOpen(false);
    setRetryCount((c) => c + 1);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page-content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div
            className="skeleton"
            style={{ width: 120, height: 32, borderRadius: 8 }}
          />
          <div
            className="skeleton"
            style={{ width: 130, height: 36, borderRadius: 10 }}
          />
        </div>
        <div className="grid-3col">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="page-content">
        <div
          className="card"
          style={{
            padding: 40,
            textAlign: "center",
            maxWidth: 400,
            margin: "80px auto",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            <Icon name="info" size={32} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Could not load accounts
          </div>
          <div className="muted" style={{ marginBottom: 20, fontSize: 13 }}>
            There was a problem fetching your accounts. Please try again.
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setRetryCount((c) => c + 1)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (accounts.length === 0) {
    return (
      <div className="page-content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Accounts</h1>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <Icon name="plus" size={14} /> Add account
          </button>
        </div>

        <div
          className="card"
          style={{
            padding: 60,
            textAlign: "center",
            maxWidth: 400,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "var(--ink-3)",
            }}
          >
            <Icon name="bank" size={28} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            No accounts yet
          </div>
          <div className="muted" style={{ marginBottom: 24, fontSize: 13 }}>
            Connect your first account to start tracking your finances.
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <Icon name="plus" size={14} /> Add account
          </button>
        </div>

        <Modal open={addOpen} title="Add account" onClose={() => setAddOpen(false)}>
          <AddAccountForm onClose={handleAccountAdded} />
        </Modal>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────────

  return (
    <div className="page-content">
      {/* Page heading + Add button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Accounts</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setAddOpen(true)}
        >
          <Icon name="plus" size={14} /> Add account
        </button>
      </div>

      {/* Account grid */}
      <div className="grid-3col">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add account modal */}
      <Modal open={addOpen} title="Add account" onClose={() => setAddOpen(false)}>
        <AddAccountForm onClose={handleAccountAdded} />
      </Modal>
    </div>
  );
}
