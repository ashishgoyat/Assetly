"use client";

/**
 * NewGoalForm — form inside the "New goal" modal.
 * Submits to the createGoal server action.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import type { IconName } from "@/app/components/ui/Icon";
import { createGoal } from "@/app/dashboard/goals/actions";
import type { Goal } from "@/contracts/api-contracts";

interface NewGoalFormProps {
  onClose: () => void;
  onCreated?: (goal: Goal) => void;
}

const ICON_OPTIONS: { name: IconName; label: string }[] = [
  { name: "lock", label: "Lock" },
  { name: "flag", label: "Flag" },
  { name: "card", label: "Card" },
  { name: "heart", label: "Heart" },
  { name: "spark", label: "Star" },
  { name: "goal", label: "Goal" },
];

export default function NewGoalForm({ onClose, onCreated }: NewGoalFormProps) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<IconName>("lock");
  const [vibe, setVibe] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("targetInCents", target);
      formData.set("monthlyContributionInCents", monthly);
      formData.set("icon", selectedIcon);
      formData.set("color", "var(--cat-2)");
      formData.set("vibe", vibe);

      const result = await createGoal(formData);
      if (result.success) {
        onCreated?.(result.goal);
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("[NewGoalForm] unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Goal name */}
        <div className="field">
          <label htmlFor="goal-name">Goal name</label>
          <input
            id="goal-name"
            type="text"
            className="field-input"
            placeholder="e.g. Emergency fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoComplete="off"
          />
        </div>

        {/* Target amount */}
        <div className="field">
          <label htmlFor="goal-target">Target amount</label>
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
              id="goal-target"
              type="number"
              className="field-input"
              placeholder="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              min="0"
              step="any"
              required
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Monthly contribution */}
        <div className="field">
          <label htmlFor="goal-monthly">Monthly contribution</label>
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
              id="goal-monthly"
              type="number"
              className="field-input"
              placeholder="0"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              min="0"
              step="any"
              required
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Icon picker */}
        <div className="field">
          <span className="field-group-label">Icon</span>
          <div
            role="radiogroup"
            aria-label="Goal icon"
            style={{ display: "flex", gap: 8 }}
          >
            {ICON_OPTIONS.map((opt) => {
              const isSelected = selectedIcon === opt.name;
              return (
                <button
                  key={opt.name}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={opt.label}
                  onClick={() => setSelectedIcon(opt.name)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "var(--r)",
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    background: isSelected ? "var(--accent)" : "var(--surface-2)",
                    color: isSelected ? "white" : "var(--ink-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition:
                      "background var(--dur-fast) var(--ease-out-quart), border-color var(--dur-fast) var(--ease-out-quart), color var(--dur-fast) var(--ease-out-quart)",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={opt.name} size={18} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Vibe / tag */}
        <div className="field">
          <label htmlFor="goal-vibe">
            Tag{" "}
            <span
              style={{
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
                color: "var(--ink-4)",
              }}
            >
              (optional)
            </span>
          </label>
          <input
            id="goal-vibe"
            type="text"
            className="field-input"
            placeholder="Short description, e.g. Safety net"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            maxLength={100}
          />
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
          style={{ minWidth: 120 }}
        >
          {pending ? "Creating…" : "Create goal"}
        </button>
      </div>
    </form>
  );
}
