import { useEffect } from "react";

import confetti from "canvas-confetti";
import { Sun } from "lucide-react";

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
        confetti({
          particleCount: 38,
          spread: 88,
          startVelocity: 17,
          gravity: 0.45,
          ticks: 220,
          scalar: 0.72,
          origin: { y: 0.52 },
          colors: ["#F4C85B", "#A9C98B", "#8ECAE6", "#F0A6CA"],
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
    <div className="fixed inset-0 z-[10000] flex animate-[sunnie-overlay-fade_500ms_ease-out] flex-col items-center justify-center bg-[#fffdf5]/82 backdrop-blur-sm motion-reduce:animate-none">
      {type === "loading" && (
        <div className="mb-4 h-12 w-12 animate-spin text-blue-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {type === "celebration" && (
        <div className="mb-5 grid h-24 w-24 animate-[sunnie-celebration-bloom_2400ms_cubic-bezier(0.16,0.8,0.25,1)] place-items-center rounded-full bg-[#fff0b8] text-[#d0912d] shadow-[0_8px_30px_rgba(224,173,67,0.18)] motion-reduce:animate-none">
          <Sun className="h-12 w-12 fill-[#f4c85b]" />
        </div>
      )}

      {type === "error" && <div className="mb-4 text-5xl text-red-500">❌</div>}

      {message && (
        <p className="px-4 text-center text-lg font-medium">{message}</p>
      )}
    </div>
  );
}
