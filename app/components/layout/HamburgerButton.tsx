"use client";

/**
 * HamburgerButton — Client Component
 * Renders a hamburger icon button visible only on mobile (< 768px via .hamburger CSS class).
 * Opens the MobileDrawer when clicked.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import MobileDrawer from "@/app/components/layout/MobileDrawer";

export default function HamburgerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-icon btn-ghost hamburger"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Icon name="list" size={18} />
      </button>
      {open && <MobileDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
