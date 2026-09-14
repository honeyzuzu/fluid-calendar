import { useEffect } from "react";

import confetti from "canvas-confetti";
import { CircleX, LoaderCircle, Sun } from "lucide-react";

import { logger } from "@/lib/logger";

export type ActionType = "loading" | "celebration" | "error";

interface ActionOverlayProps {
  type: ActionType;
  message?: string;
  onComplete?: () => void;
  autoHideDuration?: number; // in milliseconds
}

export function ActionOverlay({
  type,
  message,
  onComplete,
  autoHideDuration,
}: ActionOverlayProps) {
  // Log when the overlay is shown
  useEffect(() => {
    logger.debug("[ActionOverlay] Showing overlay", {
      type,
      message: message || null,
    });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // One slow pastel shower feels celebratory without creating visual urgency.
    if (type === "celebration" && !reduceMotion) {
      try {
        const styles = getComputedStyle(document.documentElement);
        const colors = [
          "--sunnie-accent",
          "--sunnie-secondary",
          "--sunnie-cool-glow",
          "--sunnie-warm-glow",
        ]
          .map((name) => styles.getPropertyValue(name).trim())
          .filter(Boolean);
        confetti({
          particleCount: 38,
          spread: 88,
          startVelocity: 17,
          gravity: 0.45,
          ticks: 220,
          scalar: 0.72,
          origin: { y: 0.52 },
          ...(colors.length > 0 && { colors }),
          disableForReducedMotion: true,
        });
      } catch (error) {
        logger.error("[ActionOverlay] Error triggering confetti", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const hideAfter =
      autoHideDuration ??
      (type === "celebration" ? 2800 : type === "error" ? 3000 : 0);
    if (hideAfter && onComplete) {
      const timer = setTimeout(() => {
        logger.debug("[ActionOverlay] Auto-hiding overlay", { type });
        onComplete();
      }, hideAfter);

      return () => clearTimeout(timer);
    }
  }, [type, message, onComplete, autoHideDuration]);

  return (
    <div className="fixed inset-0 z-[10000] flex animate-[sunnie-overlay-fade_500ms_ease-out] flex-col items-center justify-center bg-card/85 backdrop-blur-sm motion-reduce:animate-none">
      {type === "loading" && (
        <LoaderCircle className="mb-4 h-12 w-12 animate-spin text-primary" />
      )}

      {type === "celebration" && (
        <div className="mb-5 grid h-24 w-24 animate-[sunnie-celebration-bloom_2400ms_cubic-bezier(0.16,0.8,0.25,1)] place-items-center rounded-full bg-accent/40 text-accent-foreground shadow-[var(--shadow-raised)] motion-reduce:animate-none">
          <Sun className="h-12 w-12 fill-current" />
        </div>
      )}

      {type === "error" && (
        <CircleX className="mb-4 h-12 w-12 text-destructive" />
      )}

      {message && (
        <p className="px-4 text-center text-lg font-medium">{message}</p>
      )}
    </div>
  );
}
