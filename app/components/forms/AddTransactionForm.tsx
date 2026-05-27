"use client";

/**
 * AddTransactionForm — form inside the "Add transaction" modal.
 * Submits to the createTransaction server action.
 */

import { useState } from "react";
import type { TransactionCategory, TransactionType } from "@/contracts/api-contracts";
import { createTransaction } from "@/app/dashboard/transactions/actions";

interface AddTransactionFormProps {
  onClose: () => void;
}

const CATEGORIES: TransactionCategory[] = [
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
];

const ACCOUNTS = [
  "Chase ··4521",
  "Ally Savings ··8801",
  "Brokerage ··2204",
];

export default function AddTransactionForm({ onClose }: AddTransactionFormProps) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<TransactionCategory>("Groceries");
  const [accountLabel, setAccountLabel] = useState(ACCOUNTS[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData();
      formData.set("merchant", merchant);
      formData.set("amountDollars", amount);
      formData.set("type", type);
      formData.set("category", category);
      formData.set("accountLabel", accountLabel);

      const result = await createTransaction(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("[AddTransactionForm] unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Merchant */}
        <div className="field">
          <label htmlFor="tx-merchant">Merchant</label>
          <input
            id="tx-merchant"
            type="text"
            className="field-input"
            placeholder="e.g. Trader Joe's"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            required
            maxLength={100}
            autoComplete="off"
          />
        </div>

        {/* Amount */}
        <div className="field">
          <label htmlFor="tx-amount">Amount</label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-3)",
                fontSize: 14,
                pointerEvents: "none",
              }}
              aria-hidden
            >
              $
            </span>
            <input
              id="tx-amount"
              type="number"
              className="field-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              required
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Type toggle */}
        <div className="field">
          <span className="field-group-label">Type</span>
          <div
            role="radiogroup"
            aria-label="Transaction type"
            style={{
              display: "flex",
              gap: 0,
              borderRadius: "var(--r)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--surface-2)",
            }}
          >
            {(["expense", "income"] as TransactionType[]).map((t) => {
              const isActive = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setType(t)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? "var(--ink)" : "transparent",
                    color: isActive ? "var(--surface)" : "var(--ink-3)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all var(--t-sm)",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category */}
        <div className="field">
          <label htmlFor="tx-category">Category</label>
          <select
            id="tx-category"
            className="field-input"
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Account */}
        <div className="field">
          <label htmlFor="tx-account">Account</label>
          <select
            id="tx-account"
            className="field-input"
            value={accountLabel}
            onChange={(e) => setAccountLabel(e.target.value)}
          >
            {ACCOUNTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline error */}
      {error !== null && (
        <div
          className="field-error"
          role="alert"
          style={{ marginTop: 12 }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={pending}
          aria-busy={pending}
          style={{ minWidth: 140 }}
        >
          {pending ? "Adding…" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}
