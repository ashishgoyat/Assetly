"use client";

/**
 * useExitAnimation — drives mount/unmount with a mirrored exit animation.
 *
 * Centralizes the "delay unmount until exit keyframe finishes" pattern used by
 * every popover and the shared Modal. CSS for enter / exit lives in globals.css
 * — this hook simply tells the consumer when to actually remove the node and
 * when to flag it with `data-exiting="true"` so the exit keyframe plays.
 *
 *   const { shouldRender, isExiting } = useExitAnimation(open, MOTION_MS.fast);
 *   return shouldRender && (
 *     <div className="anim-pop" data-exiting={isExiting ? "true" : "false"}>…</div>
 *   );
 *
 * Under `prefers-reduced-motion: reduce` the hook short-circuits: unmount is
 * immediate, no `isExiting` limbo, no orphaned `data-exiting` nodes.
 */

import { useEffect, useState } from "react";

export const MOTION_MS = {
  instant: 120,
  fast: 220,
  base: 320,
  slow: 480,
} as const;

interface ExitState {
  // Tracks the last `isOpen` we observed so we can detect transitions during
  // render without using a ref (which would trip react-hooks/refs).
  lastIsOpen: boolean;
  // True while either entering, fully shown, or exiting.
  rendered: boolean;
  // True only during the exit-animation window.
  exiting: boolean;
}

export function useExitAnimation(
  isOpen: boolean,
  durationMs: number,
): { shouldRender: boolean; isExiting: boolean } {
  const [state, setState] = useState<ExitState>(() => ({
    lastIsOpen: isOpen,
    rendered: isOpen,
    exiting: false,
  }));

  // React 19 pattern: derive new state during render when an external prop
  // changes. setState here is a no-op unless the comparison changes something,
  // and React will discard the in-progress render and restart with the new state.
  let next = state;
  if (state.lastIsOpen !== isOpen) {
    if (isOpen) {
      // Just opened — mount immediately, no exit.
      next = { lastIsOpen: true, rendered: true, exiting: false };
    } else if (state.rendered) {
      // Just closed while mounted — flag exit so the keyframe plays.
      // The effect below schedules the unmount.
      next = { lastIsOpen: false, rendered: true, exiting: true };
    } else {
      // Closed while already unmounted (e.g. parent toggles off-screen state).
      next = { lastIsOpen: false, rendered: false, exiting: false };
    }
    setState(next);
  }

  useEffect(() => {
    if (!next.exiting) return;

    // Reduced-motion → unmount on the next tick (setTimeout(..., 0) keeps the
    // state update out of the effect body to satisfy react-hooks/set-state-in-effect).
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 0 : durationMs;

    const t = window.setTimeout(() => {
      setState((s) =>
        s.exiting ? { ...s, rendered: false, exiting: false } : s,
      );
    }, delay);
    return () => window.clearTimeout(t);
  }, [next.exiting, durationMs]);

  return { shouldRender: next.rendered, isExiting: next.exiting };
}
