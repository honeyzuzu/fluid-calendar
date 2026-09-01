export type CalendarEventDraft = {
  title: string;
  calendarId: string;
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
  allDay: boolean;
};

export function validateCalendarEventDraft(draft: CalendarEventDraft) {
  if (!draft.title.trim()) return "Add a title before saving this event.";
  if (!draft.calendarId) return "Choose a calendar before creating this event.";
  if (
    !draft.startDay ||
    !draft.endDay ||
    (!draft.allDay && (!draft.startTime || !draft.endTime))
  ) {
    return "Choose a start and end date and time.";
  }

  const start = new Date(
    `${draft.startDay}T${draft.allDay ? "00:00" : draft.startTime}`
  );
  const end = new Date(
    `${draft.endDay}T${draft.allDay ? "00:00" : draft.endTime}`
  );
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Choose a valid start and end date and time.";
  }
  if ((draft.allDay && end < start) || (!draft.allDay && end <= start)) {
    return "The event must end after it starts.";
  }

  return null;
}
