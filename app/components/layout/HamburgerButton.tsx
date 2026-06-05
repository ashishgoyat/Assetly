"use client";

/**
 * HamburgerButton — Client Component
 * Renders a hamburger icon button visible only on mobile (< 768px via .hamburger CSS class).
 * Opens the MobileDrawer when clicked.
 */

import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import MobileDrawer from "@/app/components/layout/MobileDrawer";
import type { Account } from "@/contracts/api-contracts";

interface HamburgerButtonProps {
  userName: string;
  userInitials: string;
  userAvatarUrl: string;
  accounts: Account[];
}

export default function HamburgerButton({
  userName,
  userInitials,
  userAvatarUrl,
  accounts,
}: HamburgerButtonProps) {
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
        <Icon name="sidebar" size={18} />
      </button>
      {open && (
        <MobileDrawer
          onClose={() => setOpen(false)}
          userName={userName}
          userInitials={userInitials}
          userAvatarUrl={userAvatarUrl}
          accounts={accounts}
        />
      )}
    </>
  );
}
