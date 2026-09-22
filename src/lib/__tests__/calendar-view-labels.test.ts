import {
  getCalendarHeading,
  getCalendarNavigationUnit,
} from "@/lib/calendar-view-labels";

describe("calendar view labels", () => {
  const date = new Date(2026, 8, 14, 12);

  it.each([
    ["day", "Day"],
    ["week", "Week"],
    ["month", "Month"],
    ["multiMonth", "Year"],
    ["agenda", "Period"],
  ] as const)("uses the correct navigation unit for %s", (view, unit) => {
    expect(getCalendarNavigationUnit(view)).toBe(unit);
  });

  it("describes month and year ranges instead of a selected day", () => {
    expect(getCalendarHeading("month", date)).toBe("September 2026");
    expect(getCalendarHeading("multiMonth", date)).toBe("2026");
  });

  it("shows the visible week in the account time zone", () => {
    const instant = new Date("2026-09-21T01:00:00.000Z");
    expect(
      getCalendarHeading("week", instant, "America/New_York", "sunday")
    ).toBe("Sep 20–26, 2026");
    expect(
      getCalendarHeading("week", instant, "America/New_York", "monday")
    ).toBe("Sep 14–20, 2026");
  });
});
