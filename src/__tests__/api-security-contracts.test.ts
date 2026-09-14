import { readFileSync } from "fs";
import { join } from "path";

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
      expect(
        read(`src/app/api/calendar/${provider}/auth/route.ts`)
      ).toContain("createOAuthState(");
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
});
