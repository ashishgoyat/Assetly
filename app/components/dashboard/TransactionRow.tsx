"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import MerchantIcon from "@/app/components/ui/MerchantIcon";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import {
  setTransactionCategory,
  setTransactionNote,
  excludeTransaction,
} from "@/app/dashboard/home-actions";
import type { Transaction, TransactionCategory } from "@/contracts/api-contracts";

const CATEGORIES: readonly TransactionCategory[] = [
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Bills",
  "Transfers",
  "Income",
  "Utilities",
  "Housing",
  "Fitness",
  "Other",
] as const;

interface Props {
  tx: Transaction;
  onExcluded?: (id: string) => void;
}

export default function TransactionRow({ tx: r, onExcluded }: Props) {
  const currency = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [category, setCategory] = useState<TransactionCategory>(r.category);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>(r.category);
  const [noteInput, setNoteInput] = useState(r.note ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openCategorize() {
    setError(null);
    setAddingNote(false);
    setSelectedCategory(category);
    setCategorizing(true);
  }

  function openAddNote() {
    setError(null);
    setCategorizing(false);
    setAddingNote(true);
  }

  function handleApplyCategory() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", r.id);
      fd.set("category", selectedCategory);
      const res = await setTransactionCategory(fd);
      if (res.success) {
        setCategory(selectedCategory);
        setCategorizing(false);
      } else {
        setError(res.error);
      }
    });
  }

  function handleSaveNote() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", r.id);
      fd.set("note", noteInput);
      const res = await setTransactionNote(fd);
      if (res.success) {
        setAddingNote(false);
      } else {
        setError(res.error);
      }
    });
  }

  function handleExclude() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", r.id);
      const res = await excludeTransaction(fd);
      if (res.success) {
        onExcluded?.(r.id);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <button
        className="tx-row"
        style={{ width: "100%", textAlign: "left" }}
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((o) => !o)}
      >
        <MerchantIcon name={r.merchant} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.merchant}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {category} · {r.date}, {r.time}
          </div>
        </div>
        <div
          className="num"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: r.type === "income" ? "var(--pos)" : "var(--ink)",
          }}
        >
          {r.type === "income" ? "+" : "−"}
          {formatCurrency(r.amountInCents, currency)}
        </div>
        <Icon name={expanded ? "chevd" : "chev"} size={14} color="var(--ink-4)" />
      </button>

      {expanded && (
        <div style={{ padding: "6px 0 8px 52px" }}>
          {categorizing ? (
            <div
              style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
              aria-busy={isPending}
            >
              <select
                className="field-input"
                style={{ height: 28, padding: "0 8px", fontSize: 12 }}
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as TransactionCategory)
                }
                disabled={isPending}
                aria-label="Category"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-sm btn-primary"
                type="button"
                disabled={isPending}
                onClick={handleApplyCategory}
              >
                Apply
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                aria-label="Cancel"
                disabled={isPending}
                onClick={() => setCategorizing(false)}
              >
                ×
              </button>
            </div>
          ) : addingNote ? (
            <div
              style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
              aria-busy={isPending}
            >
              <input
                type="text"
                className="field-input"
                style={{ height: 28, padding: "0 8px", fontSize: 12, minWidth: 200 }}
                placeholder="Note"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                disabled={isPending}
                aria-label="Note"
              />
              <button
                className="btn btn-sm btn-primary"
                type="button"
                disabled={isPending}
                onClick={handleSaveNote}
              >
                Save
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                aria-label="Cancel"
                disabled={isPending}
                onClick={() => setAddingNote(false)}
              >
                ×
              </button>
            </div>
          ) : (
            <div
              style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}
              aria-busy={isPending}
            >
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                disabled={isPending}
                onClick={openCategorize}
              >
                <Icon name="list" size={11} /> Categorize
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                disabled={isPending}
                onClick={openAddNote}
              >
                <Icon name="info" size={11} /> Add note
              </button>
              <Link href="/dashboard/transactions" className="btn btn-sm btn-ghost">
                Split
              </Link>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                style={{ color: "var(--ink-3)" }}
                disabled={isPending}
                onClick={handleExclude}
              >
                Exclude
              </button>
            </div>
          )}
          {error && (
            <div style={{ marginTop: 6, color: "var(--neg)", fontSize: 11 }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
