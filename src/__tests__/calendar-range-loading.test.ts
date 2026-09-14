import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("calendar range loading contract", () => {
  it("bounds the server payload and client API reads", () => {
    const page = read("src/app/(common)/calendar/page.tsx");
    const route = read("src/app/api/events/route.ts");
    const store = read("src/store/calendar.ts");

    expect(page).toContain("getInitialCalendarRange");
    expect(page).toContain("calendarRangeWhere");
    expect(route).toContain("parseCalendarRange");
    expect(store).toContain("loadEventsForRange");
    expect(store).toContain("start: range.start.toISOString()");
    expect(store).not.toContain('fetch("/api/events")');
  });

  it("asks for the actual FullCalendar range in every view", () => {
    for (const view of ["DayView", "WeekView", "MonthView", "MultiMonthView"]) {
      expect(read(`src/components/calendar/${view}.tsx`)).toContain(
        "loadEventsForRange(arg.start, arg.end)"
      );
    }
  });
});
