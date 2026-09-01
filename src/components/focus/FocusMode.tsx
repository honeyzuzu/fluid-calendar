"use client";

import { useEffect, useState } from "react";

import { ActionOverlay } from "@/components/ui/action-overlay";

import { useFocusModeStore } from "@/store/focusMode";

import { FocusedTask } from "./FocusedTask";
import { QuickActions } from "./QuickActions";
import { TaskQueue } from "./TaskQueue";

export function FocusMode() {
  const [mounted, setMounted] = useState(false);

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
        <aside className="order-2 max-h-72 w-full flex-none border-t border-[#dfe2c8] bg-[#fffdf5] md:order-1 md:h-full md:max-h-none md:w-80 md:border-r md:border-t-0">
          <TaskQueue />
        </aside>

        {/* Main content area */}
        <main className="order-1 min-h-[55vh] flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(248,201,93,0.12),_transparent_22rem)] p-4 sm:p-8 md:order-2 md:min-h-0">
          <FocusedTask task={currentTask} />
        </main>

        {/* Right sidebar with quick actions */}
        <aside className="order-3 w-full flex-none border-t border-[#dfe2c8] bg-[#f8f3dc] md:h-full md:w-64 md:border-l md:border-t-0">
          <QuickActions />
        </aside>
      </div>
    </div>
  );
}
