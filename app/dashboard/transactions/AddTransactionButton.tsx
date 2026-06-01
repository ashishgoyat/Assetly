"use client";

/**
 * AddTransactionButton — client wrapper that owns the "Add transaction" modal state.
 */

import { useState } from "react";
import type { Transaction } from "@/contracts/api-contracts";
import Icon from "@/app/components/ui/Icon";
import Modal from "@/app/components/ui/Modal";
import AddTransactionForm from "@/app/components/forms/AddTransactionForm";

interface AddTransactionButtonProps {
  onCreated?: (tx: Transaction) => void;
}

export default function AddTransactionButton({
  onCreated,
}: AddTransactionButtonProps) {
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

      <Modal open={open} title="Add transaction" onClose={() => setOpen(false)}>
        <AddTransactionForm
          onClose={() => setOpen(false)}
          onCreated={onCreated}
        />
      </Modal>
    </>
  );
}