import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");

describe("settings hydration", () => {
  const store = readFileSync(join(repoRoot, "src/store/settings.ts"), "utf8");
  const settingsPage = readFileSync(
    join(repoRoot, "src/app/(common)/settings/page.tsx"),
    "utf8"
  );

  it("hydrates fetched values without invoking persistence setters", () => {
    const initializer = store.slice(store.indexOf("initializeSettings: async"));
    expect(initializer).toContain("get().hydrateFromServer");
    expect(initializer).not.toContain("get().updateUserSettings");
    expect(initializer).not.toContain("get().updateCalendarSettings");
  });

  it("does not request admin settings for a normal account", () => {
    expect(store).toContain("includeAdmin");
    expect(settingsPage).toContain(
      "initializeSettings({ includeAdmin: isAdmin })"
    );
  });
});
