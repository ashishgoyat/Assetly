"use client";

/**
 * AddTransactionButton — client wrapper that owns the "Add transaction" modal state.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import Modal from "@/app/components/ui/Modal";
import AddTransactionForm from "@/app/components/forms/AddTransactionForm";

export default function AddTransactionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-primary btn-sm"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Icon name="plus" size={13} /> Add transaction
      </button>

      {open && (
        <Modal title="Add transaction" onClose={() => setOpen(false)}>
          <AddTransactionForm onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
