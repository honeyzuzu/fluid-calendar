"use client";

import { useEffect, useState } from "react";

import { isMacOS } from "@/lib/utils";

export function primaryShortcutLabel(macOS: boolean): string {
  return macOS ? "⌘K" : "Ctrl K";
}

/**
 * Starts with the cross-platform Windows/Linux label for stable hydration,
 * then switches to the compact macOS glyph after client detection.
 */
export function usePrimaryShortcutLabel(): string {
  const [label, setLabel] = useState(() => primaryShortcutLabel(false));

  useEffect(() => {
    setLabel(primaryShortcutLabel(isMacOS()));
  }, []);

  return label;
}
