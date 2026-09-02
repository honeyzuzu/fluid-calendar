"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import {
  HiClock,
  HiFolder,
  HiLockClosed,
  HiPencil,
  HiTrash,
} from "react-icons/hi";

import {
  format,
  isFutureDate,
  isThisWeek,
  isThisYear,
  isToday,
  isTomorrow,
  newDate,
  newDateFromYMD,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";

import { Task, TimePreference } from "@/types/task";

interface BoardTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const energyLevelColors = {
  high: "bg-red-500/20 text-red-700 dark:text-red-400",
  medium: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  low: "bg-green-500/20 text-green-700 dark:text-green-400",
};

const timePreferenceColors = {
  [TimePreference.MORNING]: "bg-sky-500/20 text-sky-700 dark:text-sky-400",
  [TimePreference.AFTERNOON]:
    "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  [TimePreference.EVENING]:
    "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
};

// Helper function to format enum values for display
const formatEnumValue = (value: string) => {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatContextualDate = (date: Date) => {
  const localDate = newDateFromYMD(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  const now = newDate();
  now.setHours(0, 0, 0, 0);

  const isOverdue = localDate < now && !isToday(localDate);
  const isFuture = isFutureDate(localDate);
  let text = "";
  if (isToday(localDate)) {
    text = "Today";
  } else if (isTomorrow(localDate)) {
    text = "Tomorrow";
  } else if (isThisWeek(localDate)) {
    text = format(localDate, "EEEE");
  } else if (isThisYear(localDate)) {
    text = format(localDate, "MMM d");
  } else {
    text = format(localDate, "MMM d, yyyy");
  }
  if (isOverdue) {
    text = `Overdue: ${text}`;
  }
  return { text, isOverdue, isFuture };
};

export function BoardTask({ task, onEdit, onDelete }: BoardTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div className="group relative">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "animate-[sunnie-rise_450ms_cubic-bezier(0.2,0.75,0.25,1)] rounded-2xl border border-[#e4dfc9] bg-[#fffdf7] p-3.5 shadow-[0_2px_7px_rgba(72,70,48,0.07)] transition hover:-translate-y-0.5 hover:border-[#d4d8b6] hover:shadow-[0_7px_16px_rgba(72,70,48,0.11)] motion-reduce:animate-none motion-reduce:transform-none",
          isDragging && "opacity-50"
        )}
      >
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Drag ${task.title}`}
              className="-ml-1 grid h-8 w-8 shrink-0 touch-none place-items-center rounded-lg text-[#8a8d70] hover:bg-[#eef3df] active:cursor-grabbing md:cursor-grab"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center gap-2 pt-1.5">
              {task.isAutoScheduled && (
                <div
                  className="flex items-center gap-1 text-primary"
                  title="Auto-scheduled"
                >
                  <HiClock className="h-4 w-4" />
                  {task.scheduleLocked && (
                    <HiLockClosed className="h-3 w-3" title="Schedule locked" />
                  )}
                </div>
              )}
              <h3 className="task-title text-sm font-medium">{task.title}</h3>
            </div>
          </div>

          {task.description && (
            <p className="task-description line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: `${tag.color}20` || "var(--muted)",
                    color: tag.color || "var(--muted-foreground)",
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {task.energyLevel && (
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  energyLevelColors[task.energyLevel]
                )}
              >
                {formatEnumValue(task.energyLevel)}
              </span>
            )}

            {task.preferredTime && (
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  timePreferenceColors[task.preferredTime]
                )}
              >
                {formatEnumValue(task.preferredTime)}
              </span>
            )}

            {task.duration && (
              <span className="text-muted-foreground">{task.duration}m</span>
            )}

            {task.dueDate && (
              <span
                className={cn(
                  formatContextualDate(newDate(task.dueDate)).isOverdue
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {formatContextualDate(newDate(task.dueDate)).text}
              </span>
            )}

            {task.project && (
              <div className="flex items-center gap-1">
                <HiFolder className="h-3.5 w-3.5 text-[#8d8d73]" />
                <span className="text-muted-foreground">
                  {task.project.name}
                </span>
              </div>
            )}

            {task.isAutoScheduled &&
              task.scheduledStart &&
              task.scheduledEnd && (
                <span className="text-primary">
                  {format(newDate(task.scheduledStart), "p")} -{" "}
                  {format(newDate(task.scheduledEnd), "p")}
                </span>
              )}
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
          title="Edit task"
        >
          <HiPencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          title="Delete task"
        >
          <HiTrash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function BoardTaskOverlay({ task }: { task: Task }) {
  return (
    <div className="w-72 rotate-1 cursor-grabbing rounded-2xl border border-[#d5cfb5] bg-[#fffdf7] p-4 shadow-[0_20px_45px_rgba(63,61,39,0.24)] ring-2 ring-[#f0c965]/60 motion-reduce:rotate-0">
      <div className="flex items-start gap-2">
        {task.isAutoScheduled && (
          <HiClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <p className="text-sm font-semibold text-[#414530]">{task.title}</p>
      </div>
      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      )}
      {task.project && (
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <HiFolder className="h-3.5 w-3.5" /> {task.project.name}
        </p>
      )}
    </div>
  );
}
