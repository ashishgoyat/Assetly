"use client";

/**
 * NewGoalButton — client wrapper that owns the "New goal" modal state.
 * Two variants:
 *   - "default": pill button (used in page header)
 *   - "dashed":  full-width dashed card (used at the bottom of the goals grid)
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import Modal from "@/app/components/ui/Modal";
import NewGoalForm from "@/app/components/forms/NewGoalForm";

interface NewGoalButtonProps {
  variant?: "default" | "dashed";
}

export default function NewGoalButton({ variant = "default" }: NewGoalButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "dashed" ? (
        <button
          className="card"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Start a new savings goal"
          style={{
            padding: 22,
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderStyle: "dashed",
            background: "transparent",
            color: "var(--ink-3)",
            cursor: "pointer",
            transition:
              "background var(--dur-fast) var(--ease-out-quart), border-color var(--dur-fast) var(--ease-out-quart), color var(--dur-fast) var(--ease-out-quart)",
            width: "100%",
          }}
        >
          <Icon name="plus" size={18} />
          <span style={{ fontSize: 13.5 }}>
            Start a new goal — vacation, down payment, gift
          </span>
        </button>
      ) : (
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setOpen(true)}
        >
          <Icon name="plus" size={13} /> New goal
        </button>
      )}

      <Modal open={open} title="New goal" onClose={() => setOpen(false)}>
        <NewGoalForm onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
