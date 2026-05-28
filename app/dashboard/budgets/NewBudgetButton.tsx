"use client";

/**
 * NewBudgetButton — client wrapper for the "New budget" modal.
 * TODO: replace with a real form + createBudget server action when backend supports it.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import Modal from "@/app/components/ui/Modal";

export default function NewBudgetButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-sm btn-primary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Icon name="plus" size={13} /> New budget
      </button>

      {open && (
        <Modal title="New budget" onClose={() => setOpen(false)}>
          {/* TODO: replace with AddBudgetForm when createBudget server action is ready */}
          <div
            style={{
              padding: "24px 0",
              textAlign: "center",
              color: "var(--ink-3)",
            }}
          >
            <Icon name="pie" size={32} color="var(--ink-4)" />
            <div
              style={{
                fontWeight: 600,
                fontSize: 15,
                marginTop: 14,
                marginBottom: 8,
                color: "var(--ink)",
              }}
            >
              Budget creation coming soon
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              This feature is in progress. Check back soon to add custom budget categories.
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setOpen(false)}
              style={{ marginTop: 20 }}
            >
              Got it
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
