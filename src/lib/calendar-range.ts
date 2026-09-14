const DAY_MS = 24 * 60 * 60 * 1000;

export const CALENDAR_RANGE_BUFFER_DAYS = 7;
export const MAX_CALENDAR_RANGE_DAYS = 400;

export type CalendarDateRange = {
  start: Date;
  end: Date;
};

export function parseCalendarRange(
  startValue: string | null,
  endValue: string | null
): CalendarDateRange | null {
  if (!startValue || !endValue) return null;

  const start = new Date(startValue);
  const end = new Date(endValue);
  const duration = end.getTime() - start.getTime();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    duration <= 0 ||
    duration > MAX_CALENDAR_RANGE_DAYS * DAY_MS
  ) {
    return null;
  }

  return { start, end };
}

export function addCalendarRangeBuffer(
  start: Date,
  end: Date,
  days = CALENDAR_RANGE_BUFFER_DAYS
): CalendarDateRange {
  return {
    start: new Date(start.getTime() - days * DAY_MS),
    end: new Date(end.getTime() + days * DAY_MS),
  };
}

export function getInitialCalendarRange(now = new Date()): CalendarDateRange {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );
  return addCalendarRangeBuffer(monthStart, monthEnd);
}

export function calendarEventOverlapsRange(
  event: {
    start: Date | string;
    end: Date | string;
    isMaster?: boolean;
    isRecurring?: boolean;
    recurrenceRule?: string | null;
  },
  range: CalendarDateRange
) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const overlaps = start < range.end && end > range.start;
  const recurringMasterMayExpand = Boolean(
    event.isMaster &&
      event.isRecurring &&
      event.recurrenceRule &&
      start < range.end
  );

  return overlaps || recurringMasterMayExpand;
}

export function calendarRangeWhere(
  range: CalendarDateRange,
  feedIds?: readonly string[]
) {
  return {
    ...(feedIds && { feedId: { in: [...feedIds] } }),
    OR: [
      {
        start: { lt: range.end },
        end: { gt: range.start },
      },
      {
        isMaster: true,
        isRecurring: true,
        recurrenceRule: { not: null },
        start: { lt: range.end },
      },
    ],
  };
}
