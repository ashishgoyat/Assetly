"use client";

/**
 * Bills & Subscriptions page — Client Component
 * Fetches from GET /api/bills?days=period on mount and on period change.
 */

import { useState, useEffect, useCallback } from "react";
import Icon from "@/app/components/ui/Icon";
import SavingsOpportunityCard from "@/app/dashboard/bills/SavingsOpportunityCard";
import AddBillButton from "@/app/dashboard/bills/AddBillButton";
import {
  updateBillAction,
  deleteBillAction,
  createSubscription,
  updateSubscriptionAction,
  deleteSubscriptionAction,
} from "@/app/dashboard/bills/actions";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import type { BillsSummary, Bill, Subscription } from "@/contracts/api-contracts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = 30 | 60 | 90;

// ---------------------------------------------------------------------------
// Date label helper
// ---------------------------------------------------------------------------

function timelineLabels(period: number): string[] {
  const today = new Date();
  return [0, period / 4, period / 2, (3 * period) / 4, period].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + Math.round(offset));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

function BillRowSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "48px 1fr auto auto",
        gap: 12,
        alignItems: "center",
        padding: "10px 14px",
      }}
    >
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton" style={{ height: 14, width: "55%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 11, width: "35%", borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ height: 17, width: 60, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 28, width: 52, borderRadius: 999 }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline edit panel
// ---------------------------------------------------------------------------

interface EditPanelProps {
  bill: Bill;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onSaved: () => void;
}

function EditPanel({ bill, onClose, onDeleted, onSaved }: EditPanelProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", bill.id);
    const result = await updateBillAction(fd);
    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const fd = new FormData();
    fd.set("id", bill.id);
    const result = await deleteBillAction(fd);
    setDeleting(false);
    if (result.success) {
      onDeleted(bill.id);
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        padding: "14px 14px 16px",
        background: "var(--surface-2)",
        borderTop: "1px solid var(--border-2)",
        borderRadius: "0 0 var(--r) var(--r)",
      }}
    >
      <form onSubmit={handleSave} aria-label={`Edit ${bill.name}`}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div className="field">
            <label htmlFor={`edit-name-${bill.id}`}>Name</label>
            <input
              id={`edit-name-${bill.id}`}
              name="name"
              className="field-input"
              defaultValue={bill.name}
              required
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor={`edit-amount-${bill.id}`}>Amount ($)</label>
            <input
              id={`edit-amount-${bill.id}`}
              name="amountDollars"
              type="number"
              step="0.01"
              min="0.01"
              className="field-input"
              defaultValue={(bill.amountInCents / 100).toFixed(2)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={`edit-duedate-${bill.id}`}>Due date</label>
            <input
              id={`edit-duedate-${bill.id}`}
              name="dueDate"
              className="field-input"
              defaultValue={bill.dueDate}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={`edit-dueindays-${bill.id}`}>Days until due</label>
            <input
              id={`edit-dueindays-${bill.id}`}
              name="dueInDays"
              type="number"
              min="0"
              max="365"
              className="field-input"
              defaultValue={bill.dueInDays}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={`edit-category-${bill.id}`}>Category</label>
            <input
              id={`edit-category-${bill.id}`}
              name="category"
              className="field-input"
              defaultValue={bill.category}
            />
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <span
              className="field-group-label"
              id={`edit-autopay-label-${bill.id}`}
            >
              Auto-pay
            </span>
            <div className="toggle-wrap" aria-labelledby={`edit-autopay-label-${bill.id}`}>
              <label className="toggle">
                <input
                  name="isAutoPay"
                  type="checkbox"
                  value="true"
                  defaultChecked={bill.isAutoPay}
                  onChange={(e) => {
                    // Keep the hidden field in sync — checkbox is unchecked → "false"
                    const hidden = e.currentTarget
                      .closest("form")
                      ?.querySelector<HTMLInputElement>(
                        `input[name="isAutoPay"][type="hidden"]`,
                      );
                    if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
                  }}
                />
                <span className="toggle-track" aria-hidden />
                <span className="toggle-thumb" aria-hidden />
              </label>
              <span style={{ fontSize: 13 }}>Enabled</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="field-error" style={{ marginBottom: 8 }} role="alert">
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            disabled={saving || deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleDelete}
            disabled={saving || deleting}
            aria-busy={deleting}
            style={{
              marginLeft: "auto",
              color: "var(--neg)",
              borderColor: "var(--neg-soft)",
              background: "var(--neg-soft)",
            }}
            aria-label={`Delete ${bill.name}`}
          >
            <Icon name="trash" size={13} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscription inline edit panel
// ---------------------------------------------------------------------------

interface SubEditPanelProps {
  sub: Subscription;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onSaved: () => void;
}

function SubEditPanel({ sub, onClose, onDeleted, onSaved }: SubEditPanelProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", sub.id);
    const result = await updateSubscriptionAction(fd);
    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const fd = new FormData();
    fd.set("id", sub.id);
    const result = await deleteSubscriptionAction(fd);
    setDeleting(false);
    if (result.success) {
      onDeleted(sub.id);
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      style={{
        padding: "14px 10px 16px",
        background: "var(--surface-2)",
        borderTop: "1px solid var(--border-2)",
        borderRadius: "0 0 var(--r) var(--r)",
      }}
    >
      <form onSubmit={handleSave} aria-label={`Edit ${sub.name}`}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div className="field">
            <label htmlFor={`sub-edit-name-${sub.id}`}>Name</label>
            <input
              id={`sub-edit-name-${sub.id}`}
              name="name"
              className="field-input"
              defaultValue={sub.name}
              required
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor={`sub-edit-amount-${sub.id}`}>Amount / month ($)</label>
            <input
              id={`sub-edit-amount-${sub.id}`}
              name="amountDollars"
              type="number"
              step="0.01"
              min="0.01"
              className="field-input"
              defaultValue={(sub.amountMonthlyInCents / 100).toFixed(2)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={`sub-edit-nextdate-${sub.id}`}>Next date</label>
            <input
              id={`sub-edit-nextdate-${sub.id}`}
              name="nextDate"
              className="field-input"
              defaultValue={sub.nextDate}
              placeholder="Jun 1"
              required
            />
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <span
              className="field-group-label"
              id={`sub-edit-inuse-label-${sub.id}`}
            >
              In use
            </span>
            <div className="toggle-wrap" aria-labelledby={`sub-edit-inuse-label-${sub.id}`}>
              <label className="toggle">
                <input
                  name="isUsed"
                  type="checkbox"
                  value="true"
                  defaultChecked={sub.isUsed}
                  onChange={(e) => {
                    const hidden = e.currentTarget
                      .closest("form")
                      ?.querySelector<HTMLInputElement>(
                        `input[name="isUsed"][type="hidden"]`,
                      );
                    if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
                  }}
                />
                <span className="toggle-track" aria-hidden />
                <span className="toggle-thumb" aria-hidden />
              </label>
              <span style={{ fontSize: 13 }}>Active</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="field-error" style={{ marginBottom: 8 }} role="alert">
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            disabled={saving || deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleDelete}
            disabled={saving || deleting}
            aria-busy={deleting}
            style={{
              marginLeft: "auto",
              color: "var(--neg)",
              borderColor: "var(--neg-soft)",
              background: "var(--neg-soft)",
            }}
            aria-label={`Delete ${sub.name}`}
          >
            <Icon name="trash" size={13} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add subscription inline form
// ---------------------------------------------------------------------------

interface AddSubFormProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddSubForm({ onClose, onSaved }: AddSubFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await createSubscription(fd);
    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      style={{
        padding: "14px 10px 16px",
        background: "var(--surface-2)",
        borderRadius: "var(--r)",
        border: "1px solid var(--border-2)",
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--ink-2)" }}>
        New subscription
      </div>
      <form onSubmit={handleAdd} aria-label="Add subscription">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div className="field">
            <label htmlFor="sub-add-name">Name</label>
            <input
              id="sub-add-name"
              name="name"
              className="field-input"
              placeholder="Netflix"
              required
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor="sub-add-amount">Amount / month ($)</label>
            <input
              id="sub-add-amount"
              name="amountDollars"
              type="number"
              step="0.01"
              min="0.01"
              className="field-input"
              placeholder="9.99"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="sub-add-nextdate">Next date</label>
            <input
              id="sub-add-nextdate"
              name="nextDate"
              className="field-input"
              placeholder="Jun 1"
              required
            />
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <span className="field-group-label" id="sub-add-inuse-label">
              In use
            </span>
            <div className="toggle-wrap" aria-labelledby="sub-add-inuse-label">
              <label className="toggle">
                <input
                  name="isUsed"
                  type="checkbox"
                  value="true"
                />
                <span className="toggle-track" aria-hidden />
                <span className="toggle-thumb" aria-hidden />
              </label>
              <span style={{ fontSize: 13 }}>Active</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="field-error" style={{ marginBottom: 8 }} role="alert">
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscription row with inline edit toggle
// ---------------------------------------------------------------------------

interface SubRowProps {
  sub: Subscription;
  isExpanded: boolean;
  onToggleEdit: (id: string) => void;
  onDeleted: (id: string) => void;
  onSaved: () => void;
}

function SubRow({ sub, isExpanded, onToggleEdit, onDeleted, onSaved }: SubRowProps) {
  const currency = useCurrency();
  return (
    <div
      style={{
        borderRadius: "var(--r)",
        overflow: "hidden",
        transition: "background var(--t-sm)",
      }}
    >
      <button
        type="button"
        className={`tx-row${isExpanded ? "" : " card-hoverable"}`}
        onClick={() => onToggleEdit(sub.id)}
        aria-expanded={isExpanded}
        aria-label={`Edit ${sub.name}`}
        style={{
          gridTemplateColumns: "32px 1fr auto",
          padding: "8px 6px",
          width: "100%",
          textAlign: "left",
          border: 0,
          background: isExpanded ? "var(--surface-hover)" : undefined,
        }}
      >
        <div
          className="merchant-icon"
          style={{ background: sub.color + "20", color: sub.color }}
          aria-hidden
        >
          <Icon name={sub.icon as "music"} size={15} />
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {sub.name}
            {!sub.isUsed && (
              <span className="pill pill-warn" style={{ fontSize: 9.5 }}>
                unused
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            next · {sub.nextDate}
          </div>
        </div>
        <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>
          {formatCurrencyExact(sub.amountMonthlyInCents, currency)}
        </div>
      </button>

      {isExpanded && (
        <SubEditPanel
          sub={sub}
          onClose={() => onToggleEdit(sub.id)}
          onDeleted={onDeleted}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bill row with inline edit toggle
// ---------------------------------------------------------------------------

interface BillRowProps {
  bill: Bill;
  isExpanded: boolean;
  onToggleEdit: (id: string) => void;
  onDeleted: (id: string) => void;
  onSaved: () => void;
}

function BillRow({ bill, isExpanded, onToggleEdit, onDeleted, onSaved }: BillRowProps) {
  const currency = useCurrency();
  return (
    <div
      style={{
        borderRadius: "var(--r)",
        overflow: "hidden",
        transition: "background var(--t-sm)",
      }}
    >
      <button
        type="button"
        className={`tx-row${isExpanded ? "" : " card-hoverable"}`}
        onClick={() => onToggleEdit(bill.id)}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Close" : "Edit"} ${bill.name}`}
        style={{
          gridTemplateColumns: "48px 1fr auto",
          borderRadius: 0,
          width: "100%",
          textAlign: "left",
          border: 0,
          background: isExpanded ? "var(--surface-hover)" : undefined,
        }}
      >
        {/* Date badge */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: bill.isUrgent ? "var(--accent)" : "var(--bg-soft)",
            color: bill.isUrgent ? "white" : "var(--ink-2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label={`Due ${bill.dueDate}`}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {bill.dueDate.split(" ")[0]}
          </span>
          <span
            className="num"
            style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}
          >
            {bill.dueDate.split(" ")[1]}
          </span>
        </div>

        {/* Name + meta */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{bill.name}</div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 3,
            }}
          >
            {bill.isAutoPay ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--pos)",
                }}
              >
                <Icon name="check" size={11} /> Auto-pay set
              </span>
            ) : (
              <span className="pill pill-warn">Needs scheduling</span>
            )}
            <span className="dim">·</span>
            <span>{bill.category}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="num" style={{ fontSize: 17, fontWeight: 600 }}>
          {formatCurrency(bill.amountInCents, currency)}
        </div>
      </button>

      {/* Inline edit panel */}
      {isExpanded && (
        <EditPanel
          bill={bill}
          onClose={() => onToggleEdit(bill.id)}
          onDeleted={onDeleted}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillsPage() {
  const currency = useCurrency();
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<BillsSummary | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [showAddSub, setShowAddSub] = useState(false);
  // Bump to trigger a manual re-fetch on the current period
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bills?days=${period}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as
          | { data: BillsSummary; error: null }
          | { data: null; error: { message: string } };
        if (json.error) throw new Error(json.error.message);
        if (!cancelled) {
          setData(json.data);
          setBills(json.data.bills);
          setSubs(json.data.subscriptions);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load bills";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [period, refreshKey]);

  const fetchData = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setExpandedId(null);
    setExpandedSubId(null);
    setShowAddSub(false);
  }

  function handleToggleEdit(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleDeleted(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
    setExpandedId(null);
  }

  function handleToggleSubEdit(id: string) {
    setExpandedSubId((prev) => (prev === id ? null : id));
    setShowAddSub(false);
  }

  function handleSubDeleted(id: string) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    setExpandedSubId(null);
  }

  function handleShowAddSub() {
    setShowAddSub(true);
    setExpandedSubId(null);
  }

  const labels = timelineLabels(period);
  const unusedSubs = subs.filter((s) => !s.isUsed);

  return (
    <div className="page-content">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div>
          <h1 className="serif" style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}>
            Bills &amp; subscriptions
          </h1>
          <div className="muted" style={{ marginTop: 4 }}>
            {loading
              ? "Loading…"
              : data
                ? `${formatCurrency(data.totalDuePeriodInCents, currency)} due in next ${period} days`
                : null}
          </div>
        </div>
        <AddBillButton />
      </div>

      <div className="grid-2col-bills-alt">
        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Timeline card */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div>
                <div className="sec-label">Next {period} days</div>
                {loading ? (
                  <div
                    className="skeleton"
                    style={{ height: 36, width: 120, borderRadius: 6, marginTop: 6 }}
                  />
                ) : (
                  <div className="serif num" style={{ fontSize: 32, marginTop: 6 }}>
                    {data ? formatCurrency(data.totalDuePeriodInCents, currency) : "—"}
                  </div>
                )}
              </div>

              {/* Period buttons — inline, no PeriodSelector import */}
              <div
                style={{ display: "flex", gap: 4 }}
                role="group"
                aria-label="Select billing period"
              >
                {([30, 60, 90] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm${period === p ? " btn-primary" : ""}`}
                    onClick={() => handlePeriodChange(p)}
                    aria-pressed={period === p}
                  >
                    {p}d
                  </button>
                ))}
              </div>
            </div>

            {/* Visual timeline */}
            <div
              style={{ position: "relative", height: 84, marginTop: 12 }}
              aria-label="Bill due dates timeline"
            >
              {/* Base line */}
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "var(--border)",
                }}
                aria-hidden
              />

              {/* Date labels */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--f-mono)",
                  fontSize: 9.5,
                  color: "var(--ink-4)",
                }}
                aria-hidden
              >
                {labels.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Markers */}
              {!loading &&
                bills.map((b) => {
                  const pos = Math.min((b.dueInDays / period) * 100, 98);
                  return (
                    <div
                      key={b.id}
                      style={{
                        position: "absolute",
                        left: `calc(${pos}% - 4px)`,
                        top: 16,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                      title={`${b.name}: ${formatCurrency(b.amountInCents, currency)} due ${b.dueDate}`}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: b.isUrgent ? "var(--accent)" : b.color,
                          border: "2px solid var(--surface)",
                          boxShadow: "0 0 0 1px var(--border)",
                        }}
                        aria-hidden
                      />
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 10,
                          fontFamily: "var(--f-mono)",
                          color: "var(--ink-3)",
                          whiteSpace: "nowrap",
                          textAlign: "center",
                          maxWidth: 60,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        aria-hidden
                      >
                        {formatCurrency(b.amountInCents, currency)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Upcoming bills list */}
          <div className="card" style={{ padding: 8 }}>
            <div
              style={{
                padding: "12px 14px 8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Upcoming bills</div>
              <div className="muted" style={{ fontSize: 11.5 }}>
                {loading ? "…" : `${bills.length} total`}
              </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <>
                <BillRowSkeleton />
                <BillRowSkeleton />
                <BillRowSkeleton />
              </>
            )}

            {/* Error state */}
            {!loading && error && (
              <div
                style={{
                  padding: "16px 14px",
                  color: "var(--neg)",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                role="alert"
              >
                <Icon name="info" size={15} />
                <span>
                  Could not load bills. {error}.{" "}
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => void fetchData()}
                    style={{ padding: "2px 6px", fontSize: 12 }}
                  >
                    Retry
                  </button>
                </span>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && bills.length === 0 && (
              <div
                style={{
                  padding: "24px 14px",
                  textAlign: "center",
                  color: "var(--ink-3)",
                  fontSize: 13,
                }}
              >
                <Icon name="check" size={22} />
                <div style={{ marginTop: 8, fontWeight: 500 }}>
                  No bills due in the next {period} days
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Try a longer period or add a new bill above.
                </div>
              </div>
            )}

            {/* Bill rows */}
            {!loading &&
              !error &&
              bills.map((b) => (
                <BillRow
                  key={b.id}
                  bill={b}
                  isExpanded={expandedId === b.id}
                  onToggleEdit={handleToggleEdit}
                  onDeleted={handleDeleted}
                  onSaved={() => void fetchData()}
                />
              ))}
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Subscriptions */}
          <div id="subscriptions" className="card" style={{ padding: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="sec-label">Subscriptions</div>
              {!loading && data && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleShowAddSub}
                  aria-label="Add subscription"
                  title="Add subscription"
                  style={{ padding: "2px 7px", fontSize: 16, lineHeight: 1 }}
                >
                  +
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <div className="skeleton" style={{ height: 36, width: "60%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 13, width: "45%", borderRadius: 4 }} />
                <div className="div" style={{ margin: "12px 0" }} />
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr auto",
                      gap: 10,
                      padding: "8px 6px",
                      alignItems: "center",
                    }}
                  >
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 10 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div className="skeleton" style={{ height: 13, width: "70%", borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 11, width: "45%", borderRadius: 4 }} />
                    </div>
                    <div className="skeleton" style={{ height: 13, width: 44, borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : data ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <span className="serif num" style={{ fontSize: 36, lineHeight: 1 }}>
                    {formatCurrencyExact(data.totalSubsMonthlyInCents, currency)}
                  </span>
                  <span className="muted">/ month</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {formatCurrency(data.totalSubsMonthlyInCents * 12, currency)}/year ·{" "}
                  {subs.length} active
                </div>

                <div className="div" style={{ margin: "16px 0" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {/* Add subscription form — shown above the list */}
                  {showAddSub && (
                    <AddSubForm
                      onClose={() => setShowAddSub(false)}
                      onSaved={() => {
                        setShowAddSub(false);
                        void fetchData();
                      }}
                    />
                  )}

                  {/* Empty state */}
                  {subs.length === 0 && !showAddSub && (
                    <div
                      style={{
                        padding: "20px 0",
                        textAlign: "center",
                        color: "var(--ink-3)",
                        fontSize: 13,
                      }}
                    >
                      <Icon name="check" size={20} />
                      <div style={{ marginTop: 8, fontWeight: 500 }}>No subscriptions yet</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        Use the + button above to add one.
                      </div>
                    </div>
                  )}

                  {/* Subscription rows */}
                  {subs.map((s) => (
                    <SubRow
                      key={s.id}
                      sub={s}
                      isExpanded={expandedSubId === s.id}
                      onToggleEdit={handleToggleSubEdit}
                      onDeleted={handleSubDeleted}
                      onSaved={() => void fetchData()}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Savings opportunity */}
          {!loading &&
            data?.savingsOpportunityInCents !== undefined &&
            data.savingsOpportunityInCents > 0 && (
              <SavingsOpportunityCard
                savingsOpportunityInCents={data.savingsOpportunityInCents}
                savingsOpportunityNote={data.savingsOpportunityNote}
                unusedSubNames={unusedSubs.map((s) => s.name)}
              />
            )}
        </div>
      </div>
    </div>
  );
}
