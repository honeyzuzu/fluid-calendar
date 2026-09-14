import { getCalendarEventChangeKind } from "@/lib/calendar-event-update";

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
});
