export type SleepWindow = {
  start: string;
  end: string;
  configured: boolean;
};

function parseTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function atMinute(day: Date, minute: number) {
  const result = new Date(day);
  result.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  return result;
}

/** Checks a local wall-clock interval against a repeating daily sleep window. */
export function overlapsSleepHours(
  localStart: Date,
  localEnd: Date,
  sleepWindow?: SleepWindow
) {
  if (!sleepWindow?.configured || localEnd <= localStart) return false;
  const startMinute = parseTime(sleepWindow.start);
  const endMinute = parseTime(sleepWindow.end);
  if (startMinute === null || endMinute === null || startMinute === endMinute) {
    return false;
  }

  const firstDay = new Date(localStart);
  firstDay.setHours(0, 0, 0, 0);
  firstDay.setDate(firstDay.getDate() - 1);
  const lastDay = new Date(localEnd);
  lastDay.setHours(0, 0, 0, 0);

  for (
    const day = new Date(firstDay);
    day <= lastDay;
    day.setDate(day.getDate() + 1)
  ) {
    const sleepStart = atMinute(day, startMinute);
    const sleepEnd = atMinute(day, endMinute);
    if (endMinute <= startMinute) sleepEnd.setDate(sleepEnd.getDate() + 1);
    if (localStart < sleepEnd && localEnd > sleepStart) return true;
  }

  return false;
}
