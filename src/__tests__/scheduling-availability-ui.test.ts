import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

describe("scheduling availability UI", () => {
  it("offers editable presets without creating separate product modes", () => {
    const settings = read("src/components/settings/AutoScheduleSettings.tsx");

    expect(settings).toContain("Availability starting point");
    expect(settings).toContain("Days Sunnie can schedule tasks");
    expect(settings).toContain("SCHEDULING_PRESETS.map");
  });

  it("links disabled-day guidance to availability settings", () => {
    const plan = read("src/app/(common)/plan/page.tsx");

    expect(plan).toContain("isn't enabled for auto-scheduling");
    expect(plan).toContain('href="/settings#auto-schedule"');
    expect(plan).toContain("Change scheduling availability");
  });
});
