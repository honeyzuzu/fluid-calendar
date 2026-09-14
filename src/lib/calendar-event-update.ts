import { newDate } from "@/lib/date-utils";

import { CalendarEvent } from "@/types/calendar";

function sameDate(first: Date | string, second: Date | string) {
  return newDate(first).getTime() === newDate(second).getTime();
}

function sameOptionalText(first?: string | null, second?: string | null) {
  return (first || "") === (second || "");
}

/** Compare the recurrence controls the event modal can edit rather than the
 * provider's serialization. Google may include an RRULE prefix (and harmless
 * defaults such as INTERVAL=1) that the modal does not emit. Treating those as
 * content edits sends a cosmetic color change through a provider series
 * rewrite and can regenerate duplicate local instances.
 */
function editableRecurrenceSignature(rule?: string | null) {
  if (!rule) return "";

  const normalized = rule
    .trim()
    .replace(/^\[?"?RRULE:/i, "")
    .replace(/"?\]?$/, "");
  const editable = new Map<string, string>();

  for (const part of normalized.split(";")) {
    const [rawKey, rawValue = ""] = part.split("=");
    const key = rawKey.toUpperCase();
    if (key === "FREQ") editable.set(key, rawValue.toUpperCase());
    if (key === "INTERVAL") editable.set(key, rawValue || "1");
    if (key === "BYDAY") {
      editable.set(
        key,
        rawValue.toUpperCase().split(",").filter(Boolean).sort().join(",")
      );
    }
  }

  if (!editable.has("INTERVAL")) editable.set("INTERVAL", "1");
  return ["FREQ", "INTERVAL", "BYDAY"]
    .map((key) => `${key}=${editable.get(key) || ""}`)
    .join(";");
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
    editableRecurrenceSignature(original.recurrenceRule) !==
      editableRecurrenceSignature(update.recurrenceRule);
  const colorChanged =
    (original.color || null)?.toLowerCase() !==
      (update.color || null)?.toLowerCase() ||
    (original.colorSlot || null) !== (update.colorSlot || null);

  return { contentChanged, colorChanged };
}
