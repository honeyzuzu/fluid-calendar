import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Date-only week keys are Sundays, independent of the machine's timezone. */
export function parseWeek(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}(T00:00:00\.000Z)?$/.test(value)) return null;
  const key = value.slice(0, 10);
  const date = new Date(`${key}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== key ||
    date.getUTCDay() !== 0
  )
    return null;
  return date;
}

export function weekKey(dateKey: string): string {
  const date = new Date(`${dateKey.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

export function shiftWeek(key: string, weeks: number): string {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

export function currentWeek(timeZone: string, now = new Date()): string {
  return weekKey(formatInTimeZone(now, timeZone, "yyyy-MM-dd"));
}

export function weekBounds(key: string, timeZone: string) {
  return {
    start: fromZonedTime(`${key}T00:00:00`, timeZone),
    end: fromZonedTime(`${shiftWeek(key, 1)}T00:00:00`, timeZone),
  };
}

export function elapsedWeeks(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 604800000));
}

export function weekRangeLabel(key: string, locale?: string): string {
  const start = new Date(`${key}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const startParts = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(start);
  const endParts = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);
  return `${startParts} – ${endParts}`;
}
