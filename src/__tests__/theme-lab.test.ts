import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("admin Theme Lab", () => {
  const settingsPage = read("src/app/(common)/settings/page.tsx");
  const themeLab = read("src/components/settings/ThemeLab.tsx");

  it("registers Theme Lab as an admin-only Settings tab", () => {
    expect(settingsPage).toContain('{ id: "theme-lab", label: "Theme Lab" }');
    expect(settingsPage).toMatch(
      /const adminOnlyTabs = \[[\s\S]*"theme-lab"[\s\S]*\]/
    );
    expect(themeLab).toContain("<AdminOnly");
  });

  it("keeps experiments local instead of persisting user settings", () => {
    expect(themeLab).not.toContain("updateUserSettings");
    expect(themeLab).not.toContain("fetch(");
    expect(themeLab).toContain("Nothing here is saved to your account.");
  });

  it("previews the same semantic classes used by calendar rendering", () => {
    expect(themeLab).toContain("sunnie-calendar-frame");
    expect(themeLab).toContain("calendar-event-all-day");
    expect(themeLab).toContain("calendar-task");
    expect(themeLab).toContain("getThemeDomAttributes");
  });
});
