import { parseWorkDays } from "@/lib/autoSchedule";
import {
  addMinutes,
  fromZonedTime,
  roundDateUp,
  toZonedTime,
} from "@/lib/date-utils";

export type WorkingHours = {
  workDays: string;
  workHourStart: number;
  workHourEnd: number;
};

function isSameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function minutesSinceMidnight(date: Date) {
  return (
    date.getHours() * 60 +
    date.getMinutes() +
    date.getSeconds() / 60 +
    date.getMilliseconds() / 60000
  );
}

/** Checks a local wall-clock interval against the user's workday and hours. */
export function isWithinWorkingHours(
  localStart: Date,
  localEnd: Date,
  settings: WorkingHours
) {
  if (
    localEnd <= localStart ||
    !isSameLocalDay(localStart, localEnd) ||
    !Number.isInteger(settings.workHourStart) ||
    !Number.isInteger(settings.workHourEnd) ||
    settings.workHourStart < 0 ||
    settings.workHourEnd > 24 ||
    settings.workHourStart >= settings.workHourEnd
  ) {
    return false;
  }

  const workDays = parseWorkDays(settings.workDays);
  const startMinute = minutesSinceMidnight(localStart);
  const endMinute = minutesSinceMidnight(localEnd);

  return (
    workDays.includes(localStart.getDay()) &&
    startMinute >= settings.workHourStart * 60 &&
    endMinute <= settings.workHourEnd * 60
  );
}

type CandidateIntervalOptions = {
  durationMinutes: number;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  now?: Date;
  minimumLeadMinutes?: number;
  intervalMinutes?: number;
};

/** Generates UTC task intervals on a stable local-time grid inside a hard window. */
export function generateCandidateIntervals({
  durationMinutes,
  startDate,
  endDate,
  timeZone,
  now = new Date(),
  minimumLeadMinutes = 15,
  intervalMinutes = 30,
}: CandidateIntervalOptions) {
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0 ||
    !Number.isFinite(intervalMinutes) ||
    intervalMinutes <= 0 ||
    endDate <= startDate
  ) {
    return [];
  }

  const localWindowStart = toZonedTime(startDate, timeZone);
  const localWindowEnd = toZonedTime(endDate, timeZone);
  const localEarliestFromNow = addMinutes(
    toZonedTime(now, timeZone),
    minimumLeadMinutes
  );
  let localCursor = roundDateUp(
    localWindowStart > localEarliestFromNow
      ? localWindowStart
      : localEarliestFromNow,
    intervalMinutes
  );
  const intervals: { start: Date; end: Date }[] = [];

  while (localCursor < localWindowEnd) {
    const localIntervalEnd = addMinutes(localCursor, durationMinutes);
    if (localIntervalEnd <= localWindowEnd) {
      intervals.push({
        start: fromZonedTime(localCursor, timeZone),
        end: fromZonedTime(localIntervalEnd, timeZone),
      });
    }
    localCursor = addMinutes(localCursor, intervalMinutes);
  }

  return intervals;
}
