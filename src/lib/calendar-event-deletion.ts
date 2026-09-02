import { CalendarEvent } from "@/types/calendar";

export function prepareCalendarEventDeletion(
  events: CalendarEvent[],
  requestedId: string,
  mode?: "single" | "series"
) {
  const event =
    events.find((candidate) => candidate.id === requestedId) ||
    events.find(
      (candidate) =>
        candidate.isMaster && requestedId.startsWith(`${candidate.id}_`)
    );

  if (!event) return null;

  const seriesId = event.masterEventId || event.id;
  const providerEventId = mode === "series" ? seriesId : requestedId;
  const remainingEvents = events.filter((calendarEvent) =>
    mode === "series"
      ? calendarEvent.id !== seriesId &&
        calendarEvent.masterEventId !== seriesId
      : calendarEvent.id !== requestedId
  );

  return { event, providerEventId, remainingEvents };
}
