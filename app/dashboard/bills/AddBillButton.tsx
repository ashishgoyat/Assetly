"use client";

/**
 * AddBillButton — client wrapper that owns the "Add bill" modal state.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import Modal from "@/app/components/ui/Modal";
import AddBillForm from "@/app/components/forms/AddBillForm";

export default function AddBillButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Icon name="plus" size={13} /> Add bill
      </button>

      <Modal open={open} title="Add bill" onClose={() => setOpen(false)}>
        <AddBillForm onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
