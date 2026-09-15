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
});
