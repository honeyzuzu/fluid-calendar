"use client";

import { useState } from "react";

import Link from "next/link";

import { Check, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { format, newDate } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { useFocusModeStore } from "@/store/focusMode";
import { useTaskStore } from "@/store/task";

import { Task, TaskStatus } from "@/types/task";

interface TaskQueueProps {
  onSelectTask?: () => void;
  selectionLocked?: boolean;
}

export function TaskQueue({
  onSelectTask,
  selectionLocked = false,
}: TaskQueueProps) {
  const { switchToTask, currentTaskId, getQueuedTasks } = useFocusModeStore();
  const { tasks, updateTask } = useTaskStore();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState({
    ready: false,
    later: false,
    completed: false,
  });

  const readyTasks = getQueuedTasks();
  const readyIds = new Set(readyTasks.map((task) => task.id));
  const laterTasks = tasks.filter(
    (task) => task.status !== TaskStatus.COMPLETED && !readyIds.has(task.id)
  );
  const completedTasks = tasks
    .filter((task) => task.status === TaskStatus.COMPLETED)
    .sort(
      (a, b) =>
        (b.completedAt ? newDate(b.completedAt).getTime() : 0) -
        (a.completedAt ? newDate(a.completedAt).getTime() : 0)
    );
  const query = search.trim().toLocaleLowerCase();
  const matches = (task: Task) =>
    !query || task.title.toLocaleLowerCase().includes(query);

  const toggleCompletion = async (task: Task) => {
    setError(null);
    try {
      await updateTask(task.id, {
        status:
          task.status === TaskStatus.COMPLETED
            ? TaskStatus.TODO
            : TaskStatus.COMPLETED,
      });
    } catch (caught) {
      logger.error("[TaskQueue] Failed to toggle task completion", {
        taskId: task.id,
        error: caught instanceof Error ? caught.message : String(caught),
      });
      setError(`Could not update “${task.title}”. Please try again.`);
    }
  };

  const renderTask = (task: Task) => {
    const done = task.status === TaskStatus.COMPLETED;
    const current = task.id === currentTaskId;
    return (
      <li
        key={task.id}
        className={cn(
          "flex min-w-0 items-center gap-1 rounded-xl border border-transparent p-1",
          current && "border-primary/25 bg-primary/10"
        )}
      >
        <button
          type="button"
          onClick={() => {
            switchToTask(task.id);
            onSelectTask?.();
          }}
          disabled={done || (selectionLocked && !current)}
          aria-current={current ? "true" : undefined}
          className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-sm font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60"
        >
          <span
            className={cn(
              "block break-words leading-5",
              done && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
          {task.dueDate && !done && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Due {format(task.dueDate, "MMM d")}
            </span>
          )}
          {task.postponedUntil &&
            newDate(task.postponedUntil) > newDate() &&
            !done && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Available later
              </span>
            )}
        </button>
        <button
          type="button"
          onClick={() => void toggleCompletion(task)}
          disabled={selectionLocked}
          aria-label={
            done
              ? `Mark ${task.title} incomplete`
              : `Mark ${task.title} complete`
          }
          title={done ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-transparent hover:border-primary hover:text-primary"
          )}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
      </li>
    );
  };

  const renderSection = (
    key: "ready" | "later" | "completed",
    label: string,
    sectionTasks: Task[]
  ) => {
    const filtered = sectionTasks.filter(matches);
    if (!filtered.length) return null;
    const shown = query || expanded[key] ? filtered : filtered.slice(0, 4);
    return (
      <section
        className="mb-4"
        aria-label={`${label}, ${filtered.length} tasks`}
      >
        <h3 className="mb-1 px-2 text-xs font-bold text-secondary-foreground">
          {label}{" "}
          <span className="text-muted-foreground">{filtered.length}</span>
        </h3>
        <ul className="space-y-1">{shown.map(renderTask)}</ul>
        {!query && filtered.length > 4 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={expanded[key]}
            className="mt-1 w-full justify-start text-xs text-muted-foreground"
            onClick={() =>
              setExpanded((current) => ({ ...current, [key]: !current[key] }))
            }
          >
            {expanded[key] ? "Show fewer" : `Show all ${filtered.length}`}
          </Button>
        )}
      </section>
    );
  };

  const hasMatches = [...readyTasks, ...laterTasks, ...completedTasks].some(
    matches
  );

  return (
    <div className="flex h-full min-h-0 flex-col p-3">
      <div className="pr-12 md:pr-0">
        <h2 className="text-sm font-bold text-foreground">Choose a task</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pick one thing to give your attention.
        </p>
        <label htmlFor="focus-task-search" className="sr-only">
          Find a focus task
        </label>
        <div className="relative mt-3">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="focus-task-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a task"
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      {selectionLocked && (
        <p className="mt-2 rounded-lg bg-accent/70 px-2 py-1.5 text-xs text-secondary-foreground">
          Finish or end this timer before switching tasks.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-lg bg-destructive/10 px-2 py-1.5 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {renderSection("ready", "Ready to focus", readyTasks)}
        {renderSection("later", "For later", laterTasks)}
        {renderSection("completed", "Completed today", completedTasks)}
        {!hasMatches && (
          <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            {query ? "No tasks match that search." : "No tasks here yet."}
            {!query && (
              <Link
                href="/tasks"
                className="mt-2 block font-semibold text-primary underline-offset-2 hover:underline"
              >
                Add a task
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
