"use client";

/**
 * Modal — reusable dialog shell.
 * Owns its own mount/unmount via useExitAnimation so the exit animation has
 * time to play before the panel leaves the DOM. Callers pass `open` instead of
 * conditionally rendering `<Modal />` themselves.
 *
 * Traps scroll, responds to Escape key, and exposes a backdrop click to close.
 */

import { useEffect, useRef } from "react";
import Icon from "@/app/components/ui/Icon";
import { useExitAnimation, MOTION_MS } from "@/app/hooks/useExitAnimation";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { shouldRender, isExiting } = useExitAnimation(open, MOTION_MS.base);

  // Lock body scroll while the modal is mounted
  useEffect(() => {
    if (!shouldRender) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shouldRender]);

  // Close on Escape key — only when mounted and not already exiting
  useEffect(() => {
    if (!shouldRender || isExiting) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [shouldRender, isExiting, onClose]);

  // Move focus into the panel on mount
  useEffect(() => {
    if (shouldRender && !isExiting) {
      panelRef.current?.focus();
    }
  }, [shouldRender, isExiting]);

  if (!shouldRender) return null;

  const dataExiting = isExiting ? "true" : "false";

  return (
    <div
      className="modal-overlay"
      data-exiting={dataExiting}
      onClick={(e) => {
        // Close only when the click lands directly on the overlay (not panel)
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="modal-panel"
        data-exiting={dataExiting}
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
