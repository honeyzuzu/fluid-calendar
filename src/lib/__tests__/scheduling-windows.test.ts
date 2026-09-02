import {
  generateCandidateIntervals,
  isWithinWorkingHours,
} from "@/lib/scheduling-windows";

const workWeek = {
  workDays: JSON.stringify([1, 2, 3, 4, 5]),
  workHourStart: 9,
  workHourEnd: 17,
};

describe("scheduling windows", () => {
  it("uses minute-precise working-hour boundaries", () => {
    expect(
      isWithinWorkingHours(
        new Date(2026, 8, 7, 16, 0),
        new Date(2026, 8, 7, 17, 0),
        workWeek
      )
    ).toBe(true);
    expect(
      isWithinWorkingHours(
        new Date(2026, 8, 7, 16, 30),
        new Date(2026, 8, 7, 17, 30),
        workWeek
      )
    ).toBe(false);
  });

  it("rejects non-workdays, cross-day slots, and invalid hours", () => {
    expect(
      isWithinWorkingHours(
        new Date(2026, 8, 6, 10, 0),
        new Date(2026, 8, 6, 11, 0),
        workWeek
      )
    ).toBe(false);
    expect(
      isWithinWorkingHours(
        new Date(2026, 8, 7, 16, 30),
        new Date(2026, 8, 8, 9, 30),
        workWeek
      )
    ).toBe(false);
    expect(
      isWithinWorkingHours(
        new Date(2026, 8, 7, 10, 0),
        new Date(2026, 8, 7, 11, 0),
        { ...workWeek, workHourStart: 17, workHourEnd: 9 }
      )
    ).toBe(false);
  });

  it("keeps candidates inside the requested window on a 30-minute grid", () => {
    const intervals = generateCandidateIntervals({
      durationMinutes: 45,
      startDate: new Date("2026-09-07T14:10:00Z"),
      endDate: new Date("2026-09-07T16:00:00Z"),
      timeZone: "UTC",
      now: new Date("2026-09-06T12:00:00Z"),
    });

    expect(intervals.map((interval) => interval.start.toISOString())).toEqual([
      "2026-09-07T14:30:00.000Z",
      "2026-09-07T15:00:00.000Z",
    ]);
    expect(
      intervals.every(
        (interval) => interval.end <= new Date("2026-09-07T16:00:00Z")
      )
    ).toBe(true);
  });

  it("keeps a lead time from now and safely rejects invalid durations", () => {
    const intervals = generateCandidateIntervals({
      durationMinutes: 30,
      startDate: new Date("2026-09-07T08:00:00Z"),
      endDate: new Date("2026-09-07T12:00:00Z"),
      timeZone: "UTC",
      now: new Date("2026-09-07T09:05:00Z"),
    });
    expect(intervals[0].start.toISOString()).toBe("2026-09-07T09:30:00.000Z");
    expect(
      generateCandidateIntervals({
        durationMinutes: -15,
        startDate: new Date("2026-09-07T08:00:00Z"),
        endDate: new Date("2026-09-07T12:00:00Z"),
        timeZone: "UTC",
      })
    ).toEqual([]);
  });
});
