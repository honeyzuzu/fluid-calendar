"use client";

import { useEffect, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { ActionOverlay } from "@/components/ui/action-overlay";
import { SunnieSkeleton } from "@/components/ui/sunnie";

import { cn } from "@/lib/utils";

import { useFocusModeStore } from "@/store/focusMode";
import { useTaskStore } from "@/store/task";

import { FocusedTask } from "./FocusedTask";
import { TaskQueue } from "./TaskQueue";

export function FocusMode() {
  const [mounted, setMounted] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [timerActive, setTimerActive] = useState(false);
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const switchToTask = useFocusModeStore((state) => state.switchToTask);
  const currentTaskId = useFocusModeStore((state) => state.currentTaskId);

  // Add hydration safety
  const { isProcessing, actionType, actionMessage, stopProcessing } =
    useFocusModeStore();

  // Get current task and queued tasks - do this before any conditional returns
  const currentTask = tasks.find((task) => task.id === currentTaskId) ?? null;
  const hasOpenTasks = tasks.some((task) => task.status !== "completed");
  const chooseTask = () => {
    setIsQueueOpen(true);
    window.requestAnimationFrame(() =>
      document.getElementById("focus-task-search")?.focus()
    );
  };

  // This effect will only run on the client
  useEffect(() => {
    setMounted(true);
    let active = true;
    const taskId = new URLSearchParams(window.location.search).get("taskId");
    setTasksLoading(true);
    setLoadError(false);
    void (async () => {
      await fetchTasks({ ignoreFilters: true });
      if (!active) return;
      if (useTaskStore.getState().error) {
        setLoadError(true);
        setTasksLoading(false);
        return;
      }
      if (taskId) {
        let task = useTaskStore
          .getState()
          .tasks.find((item) => item.id === taskId);
        if (!task) {
          const response = await fetch(
            `/api/tasks/${encodeURIComponent(taskId)}`
          );
          if (response.ok && active) {
            task = await response.json();
            if (active && task) {
              useTaskStore.setState((state) => ({
                tasks: state.tasks.some((item) => item.id === taskId)
                  ? state.tasks
                  : [task!, ...state.tasks],
              }));
            }
          }
        }
        if (task && task.status !== "completed" && active) {
          switchToTask(taskId);
          setIsQueueOpen(false);
        }
      }
      if (active) setTasksLoading(false);
    })().catch(() => {
      if (active) {
        setLoadError(true);
        setTasksLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchTasks, reloadKey, switchToTask]);

  // If not mounted yet, render a simple loading state
  if (!mounted || tasksLoading) {
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

  if (loadError) {
    return (
      <div
        role="alert"
        className="mx-auto my-8 max-w-md rounded-2xl border border-border bg-card p-6 text-center"
      >
        <h1 className="text-lg font-semibold">
          Could not load your focus tasks
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your tasks are still safe. Try loading them again.
        </p>
        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
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
        {tasks.length > 0 && (
          <aside
            className={cn(
              "sunnie-theme-sidebar-pattern relative z-10 w-full flex-none overflow-hidden border-y border-border bg-card transition-[height,width] duration-300 md:order-1 md:h-full md:overflow-visible md:border-y-0 md:border-r",
              currentTask ? "order-2" : "order-1",
              isQueueOpen ? "h-[min(50vh,28rem)] md:w-80" : "h-12 md:w-12"
            )}
          >
            {!isQueueOpen && (
              <span className="absolute left-4 top-3 text-sm font-semibold text-secondary-foreground md:hidden">
                Choose another task
              </span>
            )}
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
              <TaskQueue
                selectionLocked={timerActive}
                onSelectTask={() => {
                  if (window.innerWidth < 768) setIsQueueOpen(false);
                }}
              />
            </div>
          </aside>
        )}

        {/* Main content area */}
        <main
          className={cn(
            "min-h-[55vh] min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--sunnie-warm-glow)_14%,transparent),transparent_22rem)] p-3 min-[380px]:p-4 sm:p-8 md:order-2 md:min-h-0",
            currentTask ? "order-1" : "order-2"
          )}
        >
          <FocusedTask
            task={currentTask}
            hasOpenTasks={hasOpenTasks}
            onChooseTask={chooseTask}
            onSessionActiveChange={setTimerActive}
          />
        </main>
      </div>
    </div>
  );
}
