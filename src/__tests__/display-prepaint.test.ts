import { readFileSync } from "fs";
import { join } from "path";

import {
  DISPLAY_PREFERENCES_STORAGE_KEY,
  getDisplayPreferenceHtmlAttributes,
  getDisplayPreferencePrepaintScript,
  getDisplayPreferenceSnapshot,
} from "@/lib/display-preferences";

const repoRoot = join(__dirname, "..", "..");

describe("Sunnie display first paint", () => {
  it("serializes generic theme attributes and variables", () => {
    const snapshot = getDisplayPreferenceSnapshot(
      "winter-candlelight-snow",
      "bujo",
      "reduced"
    );

    expect(snapshot.attributes).toEqual(
      expect.objectContaining({
        colorTheme: "winter-candlelight-snow",
        calendarStyle: "bujo",
        calendarGrid: "graph-paper",
        sunnieMotion: "reduced",
      })
    );
    expect(snapshot.variables["--sunnie-canvas"]).toBe("#E9EDF3");
  });

  it("emits root-safe data attribute names", () => {
    expect(getDisplayPreferenceHtmlAttributes("base", "classic")).toEqual(
      expect.objectContaining({
        "data-color-theme": "base",
        "data-calendar-style": "classic",
        "data-sunnie-motion": "full",
      })
    );
  });

  it("pre-paints from the non-sensitive display cache", () => {
    const script = getDisplayPreferencePrepaintScript();
    const layout = readFileSync(join(repoRoot, "src/app/layout.tsx"), "utf8");

    expect(script).toContain(DISPLAY_PREFERENCES_STORAGE_KEY);
    expect(script).toContain("document.documentElement");
    expect(script).toContain("setProperty");
    expect(layout).toContain('id="sunnie-display-prepaint"');
  });
});
