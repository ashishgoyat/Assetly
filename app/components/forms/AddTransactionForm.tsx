"use client";

/**
 * AddTransactionForm — form inside the "Add transaction" modal.
 * Submits to the createTransaction server action.
 */

import { useState, useEffect } from "react";
import type {
  Account,
  Budget,
  Transaction,
  TransactionCategory,
  TransactionType,
  PaymentMethod,
} from "@/contracts/api-contracts";
import { createTransaction } from "@/app/dashboard/transactions/actions";
import { useCurrency } from "@/app/contexts/CurrencyContext";
import { getCurrencySymbol } from "@/lib/format";

interface AddTransactionFormProps {
  onClose: () => void;
  onCreated?: (tx: Transaction) => void;
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

export default function AddTransactionForm({
  onClose,
  onCreated,
}: AddTransactionFormProps) {
  const currency = useCurrency();
  const currSymbol = getCurrencySymbol(currency);

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<TransactionCategory>("Groceries");
  const [accountLabel, setAccountLabel] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [chargePercent, setChargePercent] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [budgetList, setBudgetList] = useState<Budget[]>([]);
  const [budgetId, setBudgetId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real accounts from GET /api/accounts on mount
  useEffect(() => {
    const base = "";
    fetch(`${base}/api/accounts`)
      .then((r) => r.json())
      .then((d: { data?: Account[] }) => {
        if (d.data && d.data.length > 0) {
          setAccounts(d.data);
          setAccountLabel(`${d.data[0].name} ${d.data[0].number}`);
        }
      })
      .catch(() => {
        // Non-critical — the form will show a validation error if the user
        // submits without a valid account selected.
      })
      .finally(() => setAccountsLoading(false));
  }, []);

  // Fetch budgets for the current month on mount
  useEffect(() => {
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    fetch(`/api/budgets?month=${month}`)
      .then((r) => r.json())
      .then((d: { data?: { budgets: Budget[] } }) => {
        if (d.data?.budgets) setBudgetList(d.data.budgets);
      })
      .catch(() => {});
  }, []);

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
      formData.set("accountLabel", paymentMethod === "cash" ? "Cash" : accountLabel);
      formData.set("paymentMethod", paymentMethod);
      if (chargePercent) formData.set("chargePercent", chargePercent);
      if (budgetId) formData.set("budgetId", budgetId);

      const result = await createTransaction(formData);
      if (result.success) {
        if (result.transaction) {
          onCreated?.(result.transaction);
        }
        onClose();
        window.dispatchEvent(new CustomEvent("assetly:notifications-refresh"));
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

  const budgetsForCategory = budgetList.filter((b) => b.category === category);
  const showBudgetPicker = budgetsForCategory.length > 1;

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
              {currSymbol}
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
                    transition:
                      "background var(--dur-fast) var(--ease-out-quart), color var(--dur-fast) var(--ease-out-quart), font-weight var(--dur-fast) var(--ease-out-quart)",
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
            onChange={(e) => {
              const newCat = e.target.value as TransactionCategory;
              setCategory(newCat);
              const matching = budgetList.filter((b) => b.category === newCat);
              setBudgetId(matching.length > 1 ? matching[0].id : "");
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Budget picker — only shown when the selected category has multiple budgets */}
        {showBudgetPicker && (
          <div className="field">
            <label htmlFor="tx-budget">Which budget?</label>
            <select
              id="tx-budget"
              className="field-input"
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
            >
              {budgetsForCategory.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Account — hidden for cash payments */}
        {paymentMethod !== "cash" && (
          <div className="field">
            <label htmlFor="tx-account">Account</label>
            <select
              id="tx-account"
              className="field-input"
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              disabled={accountsLoading}
              aria-busy={accountsLoading}
            >
              {accountsLoading ? (
                <option value="">Loading accounts…</option>
              ) : accounts.length === 0 ? (
                <option value="">No accounts found</option>
              ) : (
                accounts.map((a) => {
                  const label = `${a.name} ${a.number}`;
                  return (
                    <option key={a.id} value={label}>
                      {label}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        )}

        {/* Payment method toggle */}
        <div className="field">
          <span className="field-group-label">Payment</span>
          <div
            role="radiogroup"
            aria-label="Payment method"
            style={{
              display: "flex",
              gap: 0,
              borderRadius: "var(--r)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--surface-2)",
            }}
          >
            {(
              [
                { value: "upi", label: "UPI" },
                { value: "card", label: "Card" },
                { value: "cash", label: "Cash" },
                { value: "bank_transfer", label: "Bank" },
              ] as { value: PaymentMethod; label: string }[]
            ).map(({ value, label }) => {
              const isActive = paymentMethod === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setPaymentMethod(value)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? "var(--ink)" : "transparent",
                    color: isActive ? "var(--surface)" : "var(--ink-3)",
                    border: "none",
                    cursor: "pointer",
                    transition:
                      "background var(--dur-fast) var(--ease-out-quart), color var(--dur-fast) var(--ease-out-quart), font-weight var(--dur-fast) var(--ease-out-quart)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Charge / Fee % (optional) */}
        <div className="field">
          <label htmlFor="tx-charge">
            Charge / Fee <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(optional %)</span>
          </label>
          <input
            id="tx-charge"
            type="number"
            className="field-input"
            placeholder="e.g. 11.5"
            value={chargePercent}
            onChange={(e) => setChargePercent(e.target.value)}
            min="0"
            max="100"
            step="any"
          />
        </div>

        {/* Live net preview */}
        {amount && chargePercent && parseFloat(chargePercent) > 0 && (
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: -8, paddingLeft: 2 }}>
            Net after {chargePercent}% charge:{" "}
            <strong style={{ color: "var(--ink)" }}>
              {currSymbol}{(parseFloat(amount) * (1 - parseFloat(chargePercent) / 100)).toFixed(2)}
            </strong>
          </div>
        )}
      </div>

      {/* Inline error */}
      {error !== null && (
        <div className="field-error" role="alert" style={{ marginTop: 12 }}>
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