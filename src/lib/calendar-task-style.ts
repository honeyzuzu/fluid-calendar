import { Priority } from "@/types/task";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

interface CalendarTaskStyleInput {
  isTask: boolean;
  priority?: string | null;
  durationMs: number;
}

export function getCalendarItemClassNames({
  isTask,
  priority,
  durationMs,
}: CalendarTaskStyleInput): string[] {
  if (!isTask) return ["calendar-event"];

  const normalizedPriority = Object.values(Priority).includes(
    priority as Priority
  )
    ? (priority as Priority)
    : Priority.NONE;

  return [
    "calendar-task",
    `calendar-task-priority-${normalizedPriority}`,
    ...(durationMs > 0 && durationMs <= THIRTY_MINUTES_MS
      ? ["calendar-task-compact"]
      : []),
  ];
}
