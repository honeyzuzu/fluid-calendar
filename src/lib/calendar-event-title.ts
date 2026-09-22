/** Missing provider summaries are common on free/busy shared calendars. */
export function isUntitledImportedEvent(event: {
  title: string;
  externalEventId?: string | null;
}) {
  return Boolean(event.externalEventId) && event.title === "Untitled Event";
}

export function getCalendarEventTitle(event: {
  title: string;
  titleOverride?: string | null;
  externalEventId?: string | null;
  isFree?: boolean;
}) {
  return (
    event.titleOverride?.trim() ||
    (isUntitledImportedEvent(event)
      ? event.isFree
        ? "Free"
        : "Busy"
      : event.title)
  );
}
