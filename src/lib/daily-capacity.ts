export type DailyCapacitySettings = {
  enabled: boolean;
  start: string;
  end: string;
  days: number[];
};

type CapacityTask = {
  duration: number | null;
  blockEventId?: string | null;
  blockFeedId?: string | null;
};

type CapacityEvent = {
  start: string;
  end: string;
  allDay: boolean;
  status?: string | null;
  externalEventId?: string | null;
  feedId?: string | null;
};

export type DailyCapacity = {
  capacityMinutes: number | null;
  taskMinutes: number;
  meetingMinutes: number;
  usedMinutes: number;
  remainingMinutes: number | null;
  ratio: number | null;
  state: "comfortable" | "near" | "over" | "unavailable";
};

function timeOnDate(date: Date, value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function mergedMinutes(intervals: Array<[number, number]>) {
  const sorted = intervals
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);
  if (!sorted.length) return 0;
  let total = 0;
  let [currentStart, currentEnd] = sorted[0];
  for (const [start, end] of sorted.slice(1)) {
    if (start <= currentEnd) currentEnd = Math.max(currentEnd, end);
    else {
      total += currentEnd - currentStart;
      [currentStart, currentEnd] = [start, end];
    }
  }
  return Math.round((total + currentEnd - currentStart) / 60_000);
}

export function calculateDailyCapacity(
  date: Date,
  tasks: CapacityTask[],
  events: CapacityEvent[],
  settings: DailyCapacitySettings | null
): DailyCapacity {
  const taskMinutes = tasks.reduce(
    (total, task) => total + Math.max(0, task.duration ?? 30),
    0
  );
  const unavailable = (meetingMinutes = 0): DailyCapacity => ({
    capacityMinutes: null,
    taskMinutes,
    meetingMinutes,
    usedMinutes: taskMinutes + meetingMinutes,
    remainingMinutes: null,
    ratio: null,
    state: "unavailable",
  });
  if (!settings?.enabled || !settings.days.includes(date.getDay())) {
    return unavailable();
  }
  const workStart = timeOnDate(date, settings.start);
  const workEnd = timeOnDate(date, settings.end);
  if (!workStart || !workEnd) return unavailable();
  if (workEnd <= workStart) workEnd.setDate(workEnd.getDate() + 1);

  const mirroredBlocks = new Set(
    tasks
      .filter((task) => task.blockEventId && task.blockFeedId)
      .map((task) => `${task.blockFeedId}:${task.blockEventId}`)
  );
  const meetingMinutes = mergedMinutes(
    events
      .filter(
        (event) =>
          !event.allDay &&
          event.status?.toLowerCase() !== "cancelled" &&
          !mirroredBlocks.has(`${event.feedId}:${event.externalEventId}`)
      )
      .map((event) => [
        Math.max(new Date(event.start).getTime(), workStart.getTime()),
        Math.min(new Date(event.end).getTime(), workEnd.getTime()),
      ])
  );
  const capacityMinutes = Math.round(
    (workEnd.getTime() - workStart.getTime()) / 60_000
  );
  const usedMinutes = taskMinutes + meetingMinutes;
  const ratio = capacityMinutes > 0 ? usedMinutes / capacityMinutes : null;
  return {
    capacityMinutes,
    taskMinutes,
    meetingMinutes,
    usedMinutes,
    remainingMinutes: capacityMinutes - usedMinutes,
    ratio,
    state:
      ratio === null
        ? "unavailable"
        : ratio > 1
          ? "over"
          : ratio >= 0.8
            ? "near"
            : "comfortable",
  };
}

export function formatCapacityTime(minutes: number) {
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remainder = absolute % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}
