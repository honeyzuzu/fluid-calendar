import { fromZonedTime } from "date-fns-tz";

import type { CommitmentEvent, CommitmentHours } from "@/lib/daily-commitment";
import { dateKeyInTimeZone } from "@/lib/daily-intention";

export const RECOVERY_FEED_PREFIX = "sunnie-recovery-feed:";
export const RECOVERY_EVENT_PREFIX = "sunnie-recovery-event:";

export function recoveryFeedId(userId: string) {
  return `${RECOVERY_FEED_PREFIX}${userId}`;
}

export function recoveryEventId(userId: string, dateKey: string) {
  return `${RECOVERY_EVENT_PREFIX}${userId}:${dateKey}`;
}

function workingWindow(
  dateKey: string,
  timeZone: string,
  hours: CommitmentHours | null
) {
  if (!hours?.enabled) return null;
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  if (!hours.days.includes(weekday)) return null;
  const start = fromZonedTime(`${dateKey}T${hours.start}:00`, timeZone);
  let end = fromZonedTime(`${dateKey}T${hours.end}:00`, timeZone);
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60_000);
  return { start, end };
}

export function nextWorkingStart(
  dateKey: string,
  timeZone: string,
  hours: CommitmentHours | null
) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  for (let offset = 1; offset <= 7; offset++) {
    date.setUTCDate(date.getUTCDate() + 1);
    const nextKey = date.toISOString().slice(0, 10);
    if (!hours?.enabled || hours.days.includes(date.getUTCDay())) {
      return fromZonedTime(
        `${nextKey}T${hours?.enabled ? hours.start : "09:00"}:00`,
        timeZone
      );
    }
  }
  return null;
}

export function findRecoveryBlock(input: {
  dateKey: string;
  timeZone: string;
  hours: CommitmentHours | null;
  events: CommitmentEvent[];
  now: Date;
  minutes: number;
  protectedMinutes: number;
  protectedUntil?: Date | null;
}): { start: Date; end: Date } | null {
  const {
    dateKey,
    timeZone,
    hours,
    events,
    now,
    minutes,
    protectedMinutes,
    protectedUntil,
  } = input;
  if (dateKeyInTimeZone(now, timeZone) !== dateKey || minutes <= 0) return null;
  const window = workingWindow(dateKey, timeZone, hours);
  if (!window) return null;
  const earliest = new Date(Math.max(window.start.getTime(), now.getTime()));
  const busy = events
    .filter(
      (event) =>
        !event.allDay &&
        event.feed?.enabled !== false &&
        event.status?.toLowerCase() !== "cancelled" &&
        !event.externalEventId?.startsWith(RECOVERY_EVENT_PREFIX)
    )
    .map((event) => ({
      start: new Date(event.start).getTime(),
      end: new Date(event.end).getTime(),
    }))
    .filter((event) => event.end > earliest.getTime())
    .sort((a, b) => a.start - b.start);

  const firstOpen = (after: Date, duration: number) => {
    let cursor = after.getTime();
    const milliseconds = duration * 60_000;
    for (const event of busy) {
      if (event.end <= cursor) continue;
      if (cursor + milliseconds <= event.start) break;
      cursor = Math.max(cursor, event.end);
    }
    return cursor + milliseconds <= window.end.getTime()
      ? { start: new Date(cursor), end: new Date(cursor + milliseconds) }
      : null;
  };

  const focus =
    protectedMinutes > 0 ? firstOpen(earliest, protectedMinutes) : null;
  const afterFocus = new Date(
    Math.max(
      earliest.getTime(),
      focus?.end.getTime() ?? 0,
      protectedUntil?.getTime() ?? 0
    )
  );
  return focus || protectedUntil
    ? firstOpen(afterFocus, minutes)
    : firstOpen(earliest, minutes);
}
