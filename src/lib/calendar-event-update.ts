import { newDate } from "@/lib/date-utils";

import { CalendarEvent } from "@/types/calendar";

function sameDate(first: Date | string, second: Date | string) {
  return newDate(first).getTime() === newDate(second).getTime();
}

function sameOptionalText(first?: string | null, second?: string | null) {
  return (first || "") === (second || "");
}

export function getCalendarEventChangeKind(
  original: Partial<CalendarEvent>,
  update: Omit<CalendarEvent, "id">
) {
  const contentChanged =
    original.title !== update.title ||
    !sameOptionalText(original.description, update.description) ||
    !sameOptionalText(original.location, update.location) ||
    !sameOptionalText(original.feedId, update.feedId) ||
    !sameDate(original.start || update.start, update.start) ||
    !sameDate(original.end || update.end, update.end) ||
    Boolean(original.allDay) !== Boolean(update.allDay) ||
    Boolean(original.isRecurring) !== Boolean(update.isRecurring) ||
    !sameOptionalText(original.recurrenceRule, update.recurrenceRule);
  const colorChanged =
    (original.color || null)?.toLowerCase() !==
    (update.color || null)?.toLowerCase();

  return { contentChanged, colorChanged };
}
