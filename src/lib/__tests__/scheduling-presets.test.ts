import {
  SCHEDULING_PRESETS,
  isSchedulingDayEnabled,
  matchesSchedulingPreset,
  schedulingDayName,
} from "@/lib/scheduling-presets";

describe("scheduling availability presets", () => {
  it("offers workweek, school, and flexible starting points", () => {
    expect(SCHEDULING_PRESETS).toEqual([
      expect.objectContaining({
        id: "workweek",
        days: [1, 2, 3, 4, 5],
        startHour: 9,
        endHour: 17,
      }),
      expect.objectContaining({
        id: "school-study",
        days: [0, 1, 2, 3, 4, 5, 6],
        startHour: 8,
        endHour: 22,
      }),
      expect.objectContaining({
        id: "flexible-week",
        days: [0, 1, 2, 3, 4, 5, 6],
        startHour: 9,
        endHour: 20,
      }),
    ]);
  });

  it("matches presets regardless of saved day order", () => {
    expect(
      matchesSchedulingPreset(
        {
          workDays: "[5,4,3,2,1]",
          workHourStart: 9,
          workHourEnd: 17,
        },
        SCHEDULING_PRESETS[0]
      )
    ).toBe(true);
  });

  it("recognizes disabled weekend days by date key", () => {
    const workDays = "[1,2,3,4,5]";
    expect(isSchedulingDayEnabled("2026-09-18", workDays)).toBe(true);
    expect(isSchedulingDayEnabled("2026-09-19", workDays)).toBe(false);
    expect(schedulingDayName("2026-09-19")).toBe("Saturday");
  });
});
