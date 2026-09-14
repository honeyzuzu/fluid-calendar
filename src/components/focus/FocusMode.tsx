"use client";

import { useEffect, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { ActionOverlay } from "@/components/ui/action-overlay";
import { SunnieSkeleton } from "@/components/ui/sunnie";

import { cn } from "@/lib/utils";

import { useFocusModeStore } from "@/store/focusMode";

import { FocusedTask } from "./FocusedTask";
import { TaskQueue } from "./TaskQueue";

export function FocusMode() {
  const [mounted, setMounted] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(true);

  // Add hydration safety
  const {
    getCurrentTask,
    isProcessing,
    actionType,
    actionMessage,
    stopProcessing,
  } = useFocusModeStore();

  // Get current task and queued tasks - do this before any conditional returns
  const currentTask = getCurrentTask();

  // This effect will only run on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render a simple loading state
  if (!mounted) {
    return (
      <div
        aria-label="Loading focus mode"
        className="grid h-full gap-5 p-4 sm:p-8 md:grid-cols-[20rem_1fr]"
      >
        <SunnieSkeleton className="h-full min-h-56 rounded-3xl" />
        <SunnieSkeleton className="h-full min-h-[28rem] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-x-clip bg-background">
      {isProcessing && actionType && (
        <ActionOverlay
          type={actionType}
          message={actionMessage || undefined}
          onComplete={stopProcessing}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        {/* Left sidebar with queued tasks */}
        <aside
          className={cn(
            "sunnie-theme-sidebar-pattern relative order-2 w-full flex-none overflow-visible border-t border-border bg-card transition-[max-height,width] duration-300 md:order-1 md:h-full md:max-h-none md:border-r md:border-t-0",
            isQueueOpen ? "max-h-72 md:w-80" : "max-h-12 md:w-12"
          )}
        >
          <button
            type="button"
            onClick={() => setIsQueueOpen((current) => !current)}
            aria-label={
              isQueueOpen ? "Close focus task queue" : "Open focus task queue"
            }
            title={
              isQueueOpen ? "Close focus task queue" : "Open focus task queue"
            }
            className={cn(
              "absolute right-2 top-1.5 z-30 grid h-9 w-10 place-items-center rounded-l-xl border border-r-0 border-border bg-card text-secondary-foreground shadow-[var(--shadow-paper)] transition hover:bg-muted md:-right-7 md:top-4 md:h-11 md:w-7 md:rounded-l-none md:rounded-r-xl md:border-l-0 md:border-r"
            )}
          >
            {isQueueOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
          <div
            className={cn(
              "h-full overflow-hidden transition-opacity",
              isQueueOpen
                ? "opacity-100"
                : "pointer-events-none invisible opacity-0"
            )}
          >
            <TaskQueue />
          </div>
        </aside>

        {/* Main content area */}
        <main className="order-1 min-h-[55vh] min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--sunnie-warm-glow)_14%,transparent),transparent_22rem)] p-3 min-[380px]:p-4 sm:p-8 md:order-2 md:min-h-0">
          <FocusedTask task={currentTask} />
        </main>
      </div>
    </div>
  );
}
