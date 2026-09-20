import { dateKeyInTimeZone } from "@/lib/daily-intention";

export type DueDateShortcut = {
  id:
    | "today"
    | "tomorrow"
    | "this-weekend"
    | "next-week"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday";
  label: string;
  date: string;
  dateLabel: string;
  accessibleLabel: string;
};

const WEEKDAY_SHORTCUTS = [
  { id: "monday", label: "Mon", day: 1 },
  { id: "tuesday", label: "Tue", day: 2 },
  { id: "wednesday", label: "Wed", day: 3 },
  { id: "thursday", label: "Thu", day: 4 },
  { id: "friday", label: "Fri", day: 5 },
] as const;

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00.000Z`);
}

function shiftDateKey(key: string, days: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextWeekday(key: string, targetDay: number) {
  const currentDay = dateFromKey(key).getUTCDay();
  const difference = (targetDay - currentDay + 7) % 7;
  return shiftDateKey(key, difference === 0 ? 7 : difference);
}

function labelsForDate(key: string) {
  const date = dateFromKey(key);
  return {
    dateLabel: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date),
    accessibleLabel: new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
  };
}

export function getDueDateShortcuts(
  now = new Date(),
  timeZone: string | null = null
): DueDateShortcut[] {
  const today = dateKeyInTimeZone(now, timeZone);
  const currentDay = dateFromKey(today).getUTCDay();
  const thisWeekend = shiftDateKey(
    today,
    currentDay === 0 ? 0 : 7 - currentDay
  );
  const nextWeek = shiftDateKey(today, currentDay === 0 ? 7 : 14 - currentDay);

  const choices: Array<Pick<DueDateShortcut, "id" | "label" | "date">> = [
    { id: "today", label: "Today", date: today },
    { id: "tomorrow", label: "Tomorrow", date: shiftDateKey(today, 1) },
    { id: "this-weekend", label: "This weekend", date: thisWeekend },
    { id: "next-week", label: "Next week", date: nextWeek },
    ...WEEKDAY_SHORTCUTS.map(({ id, label, day }) => ({
      id,
      label,
      date: nextWeekday(today, day),
    })),
  ];

  return choices.map((choice) => ({
    ...choice,
    ...labelsForDate(choice.date),
  }));
}
