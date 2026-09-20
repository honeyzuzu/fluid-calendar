"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  CheckCircle2,
  Circle,
  GripVertical,
  Clock3 as HiClock,
  Folder as HiFolder,
  LockKeyhole as HiLockClosed,
  Pencil as HiPencil,
  Trash2 as HiTrash,
  MoreHorizontal,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  format,
  formatTimeInTimeZone,
  isFutureDate,
  isThisWeek,
  isThisYear,
  isToday,
  isTomorrow,
  newDate,
  newDateFromYMD,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/store/settings";

import { Priority, Task, TaskStatus } from "@/types/task";

import {
  energyLevelColors,
  formatEnumValue,
  priorityColors,
  timePreferenceColors,
} from "../utils/task-list-utils";

interface BoardTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

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

export function BoardTask({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: BoardTaskProps) {
  const { user: userSettings } = useSettingsStore();
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
          "animate-[sunnie-rise_450ms_cubic-bezier(0.2,0.75,0.25,1)] rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-paper)] transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--shadow-raised)] motion-reduce:animate-none motion-reduce:transform-none",
          task.status === TaskStatus.COMPLETED && "bg-muted/55",
          isDragging && "opacity-50"
        )}
      >
        <div className="space-y-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <button
              type="button"
              disabled={!onStatusChange}
              onClick={() =>
                onStatusChange?.(
                  task.id,
                  task.status === TaskStatus.COMPLETED
                    ? TaskStatus.TODO
                    : TaskStatus.COMPLETED
                )
              }
              aria-label={
                task.status === TaskStatus.COMPLETED
                  ? `Mark ${task.title} incomplete`
                  : `Complete ${task.title}`
              }
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60",
                task.status === TaskStatus.COMPLETED
                  ? "bg-success/15 text-success hover:bg-success/25"
                  : "text-muted-foreground hover:bg-success/10 hover:text-success"
              )}
            >
              {task.status === TaskStatus.COMPLETED ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div className="min-w-0 flex-1 pt-1.5">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className={cn(
                  "task-title block max-w-full truncate text-left text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:underline",
                  task.status === TaskStatus.COMPLETED &&
                    "text-muted-foreground line-through"
                )}
                title={`Edit ${task.title}`}
              >
                {task.title}
              </button>
            </div>
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Drag ${task.title}`}
              className="grid h-8 w-8 shrink-0 touch-none place-items-center rounded-lg text-muted-foreground/70 hover:bg-muted hover:text-foreground active:cursor-grabbing md:cursor-grab md:opacity-55 md:group-hover:opacity-100"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`More actions for ${task.title}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => onEdit(task)}>
                  <HiPencil className="mr-2 h-4 w-4" /> Edit task
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <HiTrash className="mr-2 h-4 w-4" /> Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          <div className="flex flex-wrap items-center gap-1.5 pl-11 text-xs">
            {task.isAutoScheduled && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary"
                title="Auto-scheduled"
              >
                <HiClock className="h-3.5 w-3.5" />
                {task.scheduleLocked && (
                  <HiLockClosed
                    className="h-3 w-3"
                    aria-label="Schedule locked"
                  />
                )}
                {task.scheduledStart && task.scheduledEnd
                  ? `${formatTimeInTimeZone(
                      task.scheduledStart,
                      userSettings.timeZone,
                      userSettings.timeFormat
                    )} – ${formatTimeInTimeZone(
                      task.scheduledEnd,
                      userSettings.timeZone,
                      userSettings.timeFormat
                    )}`
                  : "Auto"}
              </span>
            )}

            {task.priority && task.priority !== Priority.NONE && (
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  priorityColors[task.priority]
                )}
              >
                Priority: {formatEnumValue(task.priority)}
              </span>
            )}

            {task.energyLevel && (
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  energyLevelColors[task.energyLevel]
                )}
              >
                Energy: {formatEnumValue(task.energyLevel)}
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
                <HiFolder className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {task.project.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BoardTaskOverlay({ task }: { task: Task }) {
  return (
    <div className="w-72 rotate-1 cursor-grabbing rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-raised)] ring-2 ring-primary/60 motion-reduce:rotate-0">
      <div className="flex items-start gap-2">
        {task.isAutoScheduled && (
          <HiClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <p className="text-sm font-semibold text-foreground">{task.title}</p>
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
