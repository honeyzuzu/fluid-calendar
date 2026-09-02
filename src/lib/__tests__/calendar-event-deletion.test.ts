import { prepareCalendarEventDeletion } from "@/lib/calendar-event-deletion";

import { CalendarEvent } from "@/types/calendar";

const baseEvent: CalendarEvent = {
  id: "event-1",
  feedId: "feed-1",
  title: "Dinner",
  start: new Date("2026-09-02T18:00:00Z"),
  end: new Date("2026-09-02T19:00:00Z"),
  isRecurring: false,
  isMaster: false,
  allDay: false,
};

describe("calendar event deletion preparation", () => {
  it("removes a normal event immediately", () => {
    const result = prepareCalendarEventDeletion(
      [baseEvent, { ...baseEvent, id: "event-2" }],
      "event-1",
      "single"
    );

    expect(result?.providerEventId).toBe("event-1");
    expect(result?.remainingEvents.map((event) => event.id)).toEqual([
      "event-2",
    ]);
  });

  it("resolves a generated recurrence instance back to its series master", () => {
    const master = {
      ...baseEvent,
      id: "series-1",
      isRecurring: true,
      isMaster: true,
    };
    const exception = {
      ...baseEvent,
      id: "exception-1",
      isRecurring: true,
      masterEventId: "series-1",
    };
    const result = prepareCalendarEventDeletion(
      [master, exception, { ...baseEvent, id: "keep-me" }],
      "series-1_2026-09-03T18:00:00.000Z",
      "series"
    );

    expect(result?.providerEventId).toBe("series-1");
    expect(result?.remainingEvents.map((event) => event.id)).toEqual([
      "keep-me",
    ]);
  });
});
