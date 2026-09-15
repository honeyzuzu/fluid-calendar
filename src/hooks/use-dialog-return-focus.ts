"use client";

import { useCallback, useRef } from "react";

type CloseAutoFocusEvent = Event & { preventDefault(): void };

/** Capture the control that opened a controlled Radix dialog without a
 * DialogTrigger and restore it when the dialog closes. */
export function useDialogReturnFocus(open: boolean) {
  const wasOpen = useRef(false);
  const returnTarget = useRef<HTMLElement | null>(null);

  if (open && !wasOpen.current && typeof document !== "undefined") {
    const active = document.activeElement;
    returnTarget.current = active instanceof HTMLElement ? active : null;
  }
  wasOpen.current = open;

  return useCallback((event: CloseAutoFocusEvent) => {
    const target = returnTarget.current;
    returnTarget.current = null;
    if (!target || !target.isConnected) return;
    event.preventDefault();
    window.requestAnimationFrame(() => target.focus());
  }, []);
}
