"use client";

/**
 * AddBillForm — form inside the "Add bill" modal.
 * Submits to the createBill server action.
 */

import { useState } from "react";
import { createBill } from "@/app/dashboard/bills/actions";

interface AddBillFormProps {
  onClose: () => void;
}

export default function AddBillForm({ onClose }: AddBillFormProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueInDays, setDueInDays] = useState("");
  const [autoPay, setAutoPay] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("amountDollars", amount);
      formData.set("dueDate", dueDate);
      formData.set("dueInDays", dueInDays);
      // The server action checks for the string "true"
      formData.set("isAutoPay", autoPay ? "true" : "false");

      const result = await createBill(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("[AddBillForm] unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Bill name */}
        <div className="field">
          <label htmlFor="bill-name">Bill name</label>
          <input
            id="bill-name"
            type="text"
            className="field-input"
            placeholder="e.g. Electricity"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoComplete="off"
          />
        </div>

        {/* Amount */}
        <div className="field">
          <label htmlFor="bill-amount">Amount</label>
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
              id="bill-amount"
              type="number"
              className="field-input"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              required
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Due date and days until due — side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label htmlFor="bill-due-date">Due date</label>
            <input
              id="bill-due-date"
              type="text"
              className="field-input"
              placeholder="May 30"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="bill-due-days">Days until due</label>
            <input
              id="bill-due-days"
              type="number"
              className="field-input"
              placeholder="0"
              value={dueInDays}
              onChange={(e) => setDueInDays(e.target.value)}
              min="0"
              required
            />
          </div>
        </div>

        {/* Auto-pay toggle */}
        <div className="field">
          <span className="field-group-label">Auto-pay</span>
          <div className="toggle-wrap">
            <label className="toggle" aria-label="Enable auto-pay">
              <input
                type="checkbox"
                checked={autoPay}
                onChange={(e) => setAutoPay(e.target.checked)}
              />
              <span className="toggle-track" aria-hidden />
              <span className="toggle-thumb" aria-hidden />
            </label>
            <span
              style={{
                fontSize: 13,
                color: autoPay ? "var(--pos)" : "var(--ink-3)",
                transition: "color var(--t-sm)",
              }}
            >
              {autoPay ? "On" : "Off"}
            </span>
          </div>
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
          style={{ minWidth: 110 }}
        >
          {pending ? "Adding…" : "Add bill"}
        </button>
      </div>
    </form>
  );
}
