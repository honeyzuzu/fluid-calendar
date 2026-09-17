import {
  applyCalendarEventColor,
  getCalendarEventChangeKind,
  preserveUnchangedRecurrenceRule,
  rebaseRecurringSeriesDates,
} from "@/lib/calendar-event-update";

import { CalendarEvent } from "@/types/calendar";

const event = {
  id: "event-1",
  feedId: "feed-1",
  title: "Apple picking",
  description: "Bring a basket",
  location: "Orchard",
  start: new Date("2026-09-14T14:00:00.000Z"),
  end: new Date("2026-09-14T15:00:00.000Z"),
  allDay: false,
  isRecurring: false,
  isMaster: false,
  color: "#9BC7D9",
} satisfies CalendarEvent;

describe("calendar event update classification", () => {
  it("keeps the original series date when changing a later occurrence's duration", () => {
    const result = rebaseRecurringSeriesDates(
      new Date("2026-09-17T14:00:00.000Z"),
      new Date("2026-09-14T14:00:00.000Z"),
      new Date("2026-09-17T14:00:00.000Z"),
      new Date("2026-09-17T16:00:00.000Z")
    );
    expect(result).toEqual({
      start: new Date("2026-09-14T14:00:00.000Z"),
      end: new Date("2026-09-14T16:00:00.000Z"),
    });
  });

  it("moves the series time without moving its first date", () => {
    const result = rebaseRecurringSeriesDates(
      new Date("2026-09-17T14:00:00.000Z"),
      new Date("2026-09-14T14:00:00.000Z"),
      new Date("2026-09-17T15:00:00.000Z"),
      new Date("2026-09-17T17:00:00.000Z")
    );
    expect(result.start).toEqual(new Date("2026-09-14T15:00:00.000Z"));
    expect(result.end).toEqual(new Date("2026-09-14T17:00:00.000Z"));
  });

  it("preserves provider recurrence limits when the recurrence controls are unchanged", () => {
    expect(
      preserveUnchangedRecurrenceRule(
        "RRULE:FREQ=DAILY;COUNT=10",
        "FREQ=DAILY;INTERVAL=1"
      )
    ).toBe("RRULE:FREQ=DAILY;COUNT=10");
  });

  it("recognizes a Sunnie-only color change", () => {
    expect(
      getCalendarEventChangeKind(event, {
        ...event,
        color: "#C94F3D",
      })
    ).toEqual({ contentChanged: false, colorChanged: true });
  });

  it("requires provider synchronization when event content changes", () => {
    expect(
      getCalendarEventChangeKind(event, {
        ...event,
        title: "Apple picking with friends",
      })
    ).toEqual({ contentChanged: true, colorChanged: false });
  });

  it("recognizes equivalent provider and modal recurrence rules", () => {
    expect(
      getCalendarEventChangeKind(
        {
          ...event,
          isRecurring: true,
          recurrenceRule: "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=WE,MO",
        },
        {
          ...event,
          isRecurring: true,
          recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,WE",
          color: "#C94F3D",
        }
      )
    ).toEqual({ contentChanged: false, colorChanged: true });
  });

  it("still detects a real recurrence change", () => {
    expect(
      getCalendarEventChangeKind(
        {
          ...event,
          isRecurring: true,
          recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=MO",
        },
        {
          ...event,
          isRecurring: true,
          recurrenceRule: "FREQ=WEEKLY;BYDAY=TU",
        }
      )
    ).toEqual({ contentChanged: true, colorChanged: false });
  });

  it("applies a single color locally without touching sibling occurrences", () => {
    const sibling = {
      ...event,
      id: "event-2",
      isRecurring: true,
      masterEventId: "master-1",
    };
    const updated = applyCalendarEventColor(
      [{ ...event, isRecurring: true, masterEventId: "master-1" }, sibling],
      { ...event, isRecurring: true, masterEventId: "master-1" },
      "#C94F3D",
      "event-2",
      "single"
    );

    expect(updated[0]).toMatchObject({
      color: "#C94F3D",
      colorSlot: "event-2",
    });
    expect(updated[1].color).toBe(event.color);
  });

  it("applies a series color to master and related occurrences", () => {
    const master = {
      ...event,
      id: "master-1",
      externalEventId: "provider-series-1",
      isRecurring: true,
      isMaster: true,
    };
    const occurrence = {
      ...event,
      id: "occurrence-1",
      externalEventId: "provider-occurrence-1",
      recurringEventId: "provider-series-1",
      masterEventId: "master-1",
      isRecurring: true,
    };
    const unrelated = { ...event, id: "unrelated" };
    const updated = applyCalendarEventColor(
      [master, occurrence, unrelated],
      occurrence,
      "#C94F3D",
      "event-2",
      "series"
    );

    expect(updated[0].colorSlot).toBe("event-2");
    expect(updated[1].colorSlot).toBe("event-2");
    expect(updated[2].colorSlot).toBeUndefined();
  });
});
