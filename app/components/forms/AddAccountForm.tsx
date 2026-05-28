"use client";

import { useState } from "react";
import { createAccount } from "@/app/dashboard/accounts/actions";

interface AddAccountFormProps {
  onClose: () => void;
}

export default function AddAccountForm({ onClose }: AddAccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"checking" | "savings" | "investment">("checking");
  const [balance, setBalance] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("type", type);
      formData.set("balanceDollars", balance);
      formData.set("lastFour", lastFour);

      const result = await createAccount(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("[AddAccountForm] unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Account name */}
        <div className="field">
          <label htmlFor="account-name">Account name</label>
          <input
            id="account-name"
            type="text"
            className="field-input"
            placeholder="e.g. Chase Checking"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoComplete="off"
          />
        </div>

        {/* Account type */}
        <div className="field">
          <label htmlFor="account-type">Account type</label>
          <select
            id="account-type"
            className="field-input"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            required
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
          </select>
        </div>

        {/* Balance and last 4 — side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label htmlFor="account-balance">Current balance</label>
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
                id="account-balance"
                type="number"
                className="field-input"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                min="0"
                step="any"
                required
                style={{ paddingLeft: 28 }}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="account-last-four">Last 4 digits</label>
            <input
              id="account-last-four"
              type="text"
              className="field-input"
              placeholder="4521"
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              required
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      {error !== null && (
        <div className="field-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

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
          style={{ minWidth: 130 }}
        >
          {pending ? "Adding…" : "Add account"}
        </button>
      </div>
    </form>
  );
}
