"use client";

/**
 * Modal — reusable dialog shell.
 * Traps scroll, responds to Escape key, and exposes a backdrop click to close.
 */

import { useEffect, useRef } from "react";
import Icon from "@/app/components/ui/Icon";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while the modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Move focus into the panel on mount
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        // Close only when the click lands directly on the overlay (not panel)
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
