import { formatTimeInTimeZone, newDate } from "@/lib/date-utils";

type ScheduleValue = Date | string | null | undefined;

export type ScheduledTaskLike = {
  id: string;
  scheduledStart?: ScheduleValue;
  scheduledEnd?: ScheduleValue;
  scheduleLocked?: boolean;
};

export type ScheduleChange = {
  id: string;
  before: {
    scheduledStart: string | null;
    scheduledEnd: string | null;
    scheduleLocked: boolean;
  };
  after: {
    scheduledStart: string | null;
    scheduledEnd: string | null;
  };
};

const iso = (value: ScheduleValue) =>
  value ? newDate(value).toISOString() : null;

export function collectScheduleChanges(
  previousTasks: ScheduledTaskLike[],
  updatedTasks: ScheduledTaskLike[]
): ScheduleChange[] {
  const previousById = new Map(previousTasks.map((task) => [task.id, task]));

  return updatedTasks.flatMap((task) => {
    const previous = previousById.get(task.id);
    if (!previous) return [];
    const beforeStart = iso(previous.scheduledStart);
    const beforeEnd = iso(previous.scheduledEnd);
    const afterStart = iso(task.scheduledStart);
    const afterEnd = iso(task.scheduledEnd);
    if (beforeStart === afterStart && beforeEnd === afterEnd) return [];

    return [
      {
        id: task.id,
        before: {
          scheduledStart: beforeStart,
          scheduledEnd: beforeEnd,
          scheduleLocked: previous.scheduleLocked ?? false,
        },
        after: {
          scheduledStart: afterStart,
          scheduledEnd: afterEnd,
        },
      },
    ];
  });
}

export function formatScheduleSummary(
  changes: ScheduleChange[],
  timeZone: string,
  clockFormat: "12h" | "24h",
  windowLabel: string
): string {
  const first = [...changes]
    .filter((change) => change.after.scheduledStart)
    .sort(
      (left, right) =>
        newDate(left.after.scheduledStart!).getTime() -
        newDate(right.after.scheduledStart!).getTime()
    )[0];
  const dateLabel = first?.after.scheduledStart
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone,
      }).format(newDate(first.after.scheduledStart))
    : null;
  const timeLabel = first?.after.scheduledStart
    ? formatTimeInTimeZone(first.after.scheduledStart, timeZone, clockFormat)
    : null;

  return [
    windowLabel,
    dateLabel && timeLabel ? `First block: ${dateLabel} at ${timeLabel}` : null,
    timeZone,
    "Calendar conflicts and locked times stayed protected.",
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function restoreScheduleChanges(
  changes: ScheduleChange[]
): Promise<number> {
  const restored = await Promise.all(
    changes.map(async (change) => {
      const currentResponse = await fetch(`/api/tasks/${change.id}`, {
        cache: "no-store",
      });
      if (!currentResponse.ok) return false;
      const current = (await currentResponse.json()) as ScheduledTaskLike;

      // Do not overwrite a schedule the user changed after the toast appeared.
      if (
        iso(current.scheduledStart) !== change.after.scheduledStart ||
        iso(current.scheduledEnd) !== change.after.scheduledEnd
      ) {
        return false;
      }

      const response = await fetch(`/api/tasks/${change.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change.before),
      });
      return response.ok;
    })
  );

  return restored.filter(Boolean).length;
}
