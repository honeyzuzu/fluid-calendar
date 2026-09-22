import type { CalendarEvent, Task } from "@prisma/client";

import { blocksCalendarTime } from "@/lib/calendar-availability";

const DEFAULT_TASK_DURATION = 30;

/** Automatic refreshes keep only future task slots that still fit. An
 * unfinished task whose start time has passed must be placed again rather than
 * left at a time the user can no longer begin. */
export function needsBackgroundReschedule(
  task: Pick<Task, "scheduledStart" | "scheduledEnd" | "duration">,
  now: Date,
  events: (Pick<
    CalendarEvent,
    "start" | "end" | "allDay" | "status" | "externalEventId"
  > & { isFree?: boolean })[],
  pushedBlockIds: Set<string>,
  bufferMinutes: number
) {
  const { scheduledStart: start, scheduledEnd: end } = task;
  if (!start || !end || start < now || end <= now) return true;
  if (
    end.getTime() - start.getTime() !==
    (task.duration || DEFAULT_TASK_DURATION) * 60_000
  ) {
    return true;
  }

  const buffer = Math.max(0, bufferMinutes) * 60_000;
  return events.some(
    (event) =>
      !event.allDay &&
      blocksCalendarTime(event) &&
      (!event.externalEventId || !pushedBlockIds.has(event.externalEventId)) &&
      event.start.getTime() < end.getTime() + buffer &&
      event.end.getTime() > start.getTime() - buffer
  );
}
