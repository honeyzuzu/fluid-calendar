import {
  MAX_CALENDAR_RANGE_DAYS,
  addCalendarRangeBuffer,
  calendarEventOverlapsRange,
  calendarRangeWhere,
  parseCalendarRange,
} from "@/lib/calendar-range";

describe("calendar visible ranges", () => {
  const start = new Date("2026-09-01T00:00:00.000Z");
  const end = new Date("2026-10-01T00:00:00.000Z");

  it("accepts a bounded valid range and rejects unsafe requests", () => {
    expect(parseCalendarRange(start.toISOString(), end.toISOString())).toEqual({
      start,
      end,
    });
    expect(parseCalendarRange(null, end.toISOString())).toBeNull();
    expect(
      parseCalendarRange(end.toISOString(), start.toISOString())
    ).toBeNull();
    expect(
      parseCalendarRange(
        start.toISOString(),
        new Date(
          start.getTime() + (MAX_CALENDAR_RANGE_DAYS + 1) * 86_400_000
        ).toISOString()
      )
    ).toBeNull();
  });

  it("adds a small navigation buffer without mutating its inputs", () => {
    const buffered = addCalendarRangeBuffer(start, end);
    expect(buffered.start.toISOString()).toBe("2026-08-25T00:00:00.000Z");
    expect(buffered.end.toISOString()).toBe("2026-10-08T00:00:00.000Z");
    expect(start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("uses exclusive overlap boundaries and keeps expandable masters", () => {
    const range = { start, end };
    expect(
      calendarEventOverlapsRange(
        {
          start: "2026-08-31T23:00:00.000Z",
          end: "2026-09-01T01:00:00.000Z",
        },
        range
      )
    ).toBe(true);
    expect(
      calendarEventOverlapsRange(
        {
          start: "2026-08-01T09:00:00.000Z",
          end: "2026-08-01T10:00:00.000Z",
          isMaster: true,
          isRecurring: true,
          recurrenceRule: "FREQ=WEEKLY",
        },
        range
      )
    ).toBe(true);
    expect(
      calendarEventOverlapsRange(
        {
          start: end,
          end: new Date("2026-10-01T01:00:00.000Z"),
        },
        range
      )
    ).toBe(false);
  });

  it("builds an owner-independent range predicate with optional feed IDs", () => {
    expect(calendarRangeWhere({ start, end }, ["feed-a"])).toEqual(
      expect.objectContaining({
        feedId: { in: ["feed-a"] },
        OR: expect.any(Array),
      })
    );
  });
});
