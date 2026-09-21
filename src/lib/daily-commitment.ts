import { fromZonedTime } from "date-fns-tz";

import { dateKeyInTimeZone } from "@/lib/daily-intention";

export type CommitmentEnergyMode = "normal" | "low";

export type CommitmentTask = {
  id: string;
  status: string;
  duration: number | null;
  priority?: string | null;
  energyLevel?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  scheduledStart?: string | null;
  postponedUntil?: string | null;
  blockEventId?: string | null;
  blockFeedId?: string | null;
};

export type CommitmentEvent = {
  title?: string;
  start: string;
  end: string;
  allDay: boolean;
  status?: string | null;
  externalEventId?: string | null;
  feedId?: string | null;
  feed?: { enabled?: boolean } | null;
};

export type CommitmentHours = {
  enabled: boolean;
  start: string;
  end: string;
  days: number[];
};

export function hoursFromAutoScheduleSettings(settings: {
  workDays: string;
  workHourStart: number;
  workHourEnd: number;
}): CommitmentHours {
  let days: number[] = [];
  try {
    const parsed: unknown = JSON.parse(settings.workDays);
    if (Array.isArray(parsed)) {
      days = parsed.filter(
        (day): day is number => Number.isInteger(day) && day >= 0 && day <= 6
      );
    }
  } catch {
    // Invalid availability should not create a surprise commitment.
  }
  const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
  return {
    enabled:
      Number.isInteger(settings.workHourStart) &&
      Number.isInteger(settings.workHourEnd) &&
      settings.workHourStart >= 0 &&
      settings.workHourStart <= 23 &&
      settings.workHourEnd >= 0 &&
      settings.workHourEnd <= 23,
    start: clock(settings.workHourStart),
    end: clock(settings.workHourEnd),
    days,
  };
}

export type CommitmentSuggestion = {
  taskIds: string[];
  usableMinutes: number;
  meetingMinutes: number;
  bufferMinutes: number;
  recoveryMinutes: number;
  urgentUncommittedIds: string[];
};

function taskDay(value: string | null | undefined, timeZone: string) {
  return value ? dateKeyInTimeZone(new Date(value), timeZone) : null;
}

function dueDay(value: string | null | undefined) {
  // Due dates are stored as calendar dates at UTC midnight.
  return value?.slice(0, 10) ?? null;
}

function mergedMinutes(intervals: Array<[number, number]>) {
  const sorted = intervals
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);
  let minutes = 0;
  let active: [number, number] | null = null;
  for (const [start, end] of sorted) {
    if (!active) active = [start, end];
    else if (start <= active[1]) active[1] = Math.max(active[1], end);
    else {
      minutes += (active[1] - active[0]) / 60_000;
      active = [start, end];
    }
  }
  if (active) minutes += (active[1] - active[0]) / 60_000;
  return Math.round(minutes);
}

export function suggestDailyCommitment(input: {
  dateKey: string;
  timeZone: string;
  energyMode: CommitmentEnergyMode;
  tasks: CommitmentTask[];
  events: CommitmentEvent[];
  hours: CommitmentHours | null;
  now?: Date;
}): CommitmentSuggestion {
  const { dateKey, timeZone, energyMode, tasks, events, hours } = input;
  const now = input.now ?? new Date();
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  const working = Boolean(hours?.enabled && hours.days.includes(weekday));
  let windowMinutes = 0;
  let meetingMinutes = 0;

  if (working && hours) {
    const start = fromZonedTime(`${dateKey}T${hours.start}:00`, timeZone);
    let end = fromZonedTime(`${dateKey}T${hours.end}:00`, timeZone);
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60_000);
    const effectiveStart =
      dateKeyInTimeZone(now, timeZone) === dateKey && now > start ? now : start;
    windowMinutes = Math.max(
      0,
      Math.round((end.getTime() - effectiveStart.getTime()) / 60_000)
    );
    const mirroredBlocks = new Set(
      tasks
        .filter((task) => task.blockEventId && task.blockFeedId)
        .map((task) => `${task.blockFeedId}:${task.blockEventId}`)
    );
    meetingMinutes = mergedMinutes(
      events
        .filter(
          (event) =>
            !event.allDay &&
            event.feed?.enabled !== false &&
            event.status?.toLowerCase() !== "cancelled" &&
            !event.externalEventId?.startsWith("sunnie-recovery-event:") &&
            !mirroredBlocks.has(`${event.feedId}:${event.externalEventId}`)
        )
        .map((event): [number, number] => [
          Math.max(new Date(event.start).getTime(), effectiveStart.getTime()),
          Math.min(new Date(event.end).getTime(), end.getTime()),
        ])
    );
  }

  const bufferMinutes =
    windowMinutes > 0
      ? Math.min(windowMinutes, Math.max(15, Math.round(windowMinutes * 0.2)))
      : 0;
  const recoveryMinutes = energyMode === "low" && windowMinutes > 0 ? 30 : 0;
  const usableMinutes = Math.max(
    0,
    windowMinutes - meetingMinutes - bufferMinutes - recoveryMinutes
  );
  const targetMinutes = Math.round(
    usableMinutes * (energyMode === "low" ? 0.55 : 0.7)
  );
  const maxTasks = energyMode === "low" ? 2 : 3;

  const candidates = tasks
    .filter(
      (task) =>
        task.status !== "completed" &&
        (!task.postponedUntil || new Date(task.postponedUntil) <= now) &&
        (!task.startDate || taskDay(task.startDate, timeZone)! <= dateKey)
    )
    .sort((a, b) => {
      const score = (task: CommitmentTask) => {
        const due = dueDay(task.dueDate);
        const urgent = due && due <= dateKey ? 100 : 0;
        const soon = due && due > dateKey && due <= nextDay(dateKey) ? 30 : 0;
        const priority =
          task.priority === "high" ? 25 : task.priority === "medium" ? 10 : 0;
        const scheduled =
          taskDay(task.scheduledStart, timeZone) === dateKey ? 20 : 0;
        const chosen = taskDay(task.startDate, timeZone) === dateKey ? 15 : 0;
        const energyFit =
          energyMode === "low" && task.energyLevel === "low" ? 12 : 0;
        return urgent + soon + priority + scheduled + chosen + energyFit;
      };
      return score(b) - score(a) || a.id.localeCompare(b.id);
    });

  const taskIds: string[] = [];
  let chosenMinutes = 0;
  let highEnergyCount = 0;
  for (const task of candidates) {
    if (usableMinutes === 0) break;
    if (taskIds.length >= maxTasks) break;
    const duration = Math.max(5, task.duration ?? 30);
    if (chosenMinutes + duration > usableMinutes) continue;
    if (
      energyMode === "low" &&
      task.energyLevel === "high" &&
      highEnergyCount >= 1
    )
      continue;
    if (chosenMinutes + duration > targetMinutes && taskIds.length > 0)
      continue;
    taskIds.push(task.id);
    chosenMinutes += duration;
    if (task.energyLevel === "high") highEnergyCount++;
  }
  const urgentUncommittedIds = candidates
    .filter(
      (task) =>
        dueDay(task.dueDate) &&
        dueDay(task.dueDate)! <= dateKey &&
        !taskIds.includes(task.id)
    )
    .map((task) => task.id);

  return {
    taskIds,
    usableMinutes,
    meetingMinutes,
    bufferMinutes,
    recoveryMinutes,
    urgentUncommittedIds,
  };
}

function nextDay(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
