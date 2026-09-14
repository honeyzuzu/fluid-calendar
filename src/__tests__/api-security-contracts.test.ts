import { readFileSync } from "fs";
import { join } from "path";

import { CALENDAR_ITEM_APPEARANCES } from "@/lib/planner-themes";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("API security contracts", () => {
  it.each([
    ["src/app/api/logs/cleanup/route.ts", "requireAdmin"],
    ["src/app/api/logs/sources/route.ts", "requireAdmin"],
    ["src/app/api/logs/batch/route.ts", "authenticateRequest"],
  ])("protects %s with %s", (route, guard) => {
    expect(read(route)).toContain(`${guard}(`);
  });

  it.each(["google", "outlook"])(
    "binds the %s calendar OAuth flow to signed state",
    (provider) => {
      expect(read(`src/app/api/calendar/${provider}/auth/route.ts`)).toContain(
        "createOAuthState("
      );
      expect(read(`src/app/api/calendar/${provider}/route.ts`)).toContain(
        "verifyOAuthState("
      );
    }
  );
});

describe("Bujo presentation contracts", () => {
  const css = read("src/app/globals.css");

  it("paints paper patterns on the visible time-grid body", () => {
    expect(css).toMatch(
      /data-calendar-grid="graph-paper"[^}]*fc-timegrid-body/
    );
  });

  it("renders outline events without their filled provider background", () => {
    const outlineRule = css.slice(
      css.indexOf('data-calendar-event-appearance="outline"')
    );
    expect(outlineRule).toContain("background-color: color-mix(");
    expect(outlineRule).toContain("border-style: solid !important");
  });

  it.each(CALENDAR_ITEM_APPEARANCES)(
    "implements the %s appearance for events, tasks, and all-day events",
    (appearance) => {
      expect(css).toContain(`data-calendar-event-appearance="${appearance}"`);
      expect(css).toContain(`data-calendar-task-appearance="${appearance}"`);
      expect(css).toContain(`data-calendar-all-day-appearance="${appearance}"`);
    }
  );

  it("does not couple visual primitives to a built-in theme id", () => {
    expect(css).not.toMatch(
      /data-color-theme="(?:base|spring-fresh-air|summer-sun-kissed|autumn-golden-hour|winter-candlelight-snow)"/
    );
  });
});
