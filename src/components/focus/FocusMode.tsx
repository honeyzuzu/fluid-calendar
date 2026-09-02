"use client";

import { useEffect, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { ActionOverlay } from "@/components/ui/action-overlay";

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
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading focus mode...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#fff9e8]">
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
            "relative order-2 w-full flex-none overflow-visible border-t border-[#dfe2c8] bg-[#fffdf5] transition-[max-height,width] duration-300 md:order-1 md:h-full md:max-h-none md:border-r md:border-t-0",
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
              "absolute top-1.5 z-30 grid h-9 w-9 place-items-center rounded-full border border-[#d7d9bd] bg-[#fffdf5] text-[#5f6848] shadow-md transition hover:bg-[#eef3df] md:top-4",
              isQueueOpen ? "right-2 md:-right-4" : "left-1.5"
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
        <main className="order-1 min-h-[55vh] flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(248,201,93,0.12),_transparent_22rem)] p-4 sm:p-8 md:order-2 md:min-h-0">
          <FocusedTask task={currentTask} />
        </main>
      </div>
    </div>
  );
}
