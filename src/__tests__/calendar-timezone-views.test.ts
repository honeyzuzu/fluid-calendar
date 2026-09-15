import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("calendar account time zone", () => {
  it.each(["DayView", "WeekView", "MonthView", "MultiMonthView"])(
    "%s uses the named-zone connector and saved account zone",
    (viewName) => {
      const source = read(`src/components/calendar/${viewName}.tsx`);

      expect(source).toContain('from "@fullcalendar/luxon3"');
      expect(source).toContain("luxon3Plugin");
      expect(source).toContain('timeZone={userSettings.timeZone || "local"}');
      expect(source).not.toContain('timeZone="local"');
    }
  );
});
