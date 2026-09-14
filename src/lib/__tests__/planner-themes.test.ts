import { COLOR_THEMES } from "@/lib/color-themes";
import {
  CALENDAR_STYLES,
  SUNNIE_THEMES,
  getCalendarPresentation,
  getCalendarStyle,
  getSunnieTheme,
  isCalendarStyleId,
} from "@/lib/planner-themes";

describe("planner visual themes", () => {
  it("wraps every colorway in one higher-level visual theme", () => {
    expect(Object.keys(SUNNIE_THEMES).sort()).toEqual(
      Object.keys(COLOR_THEMES).sort()
    );

    for (const theme of Object.values(SUNNIE_THEMES)) {
      expect(theme.visual.calendar.classic).toBeDefined();
      expect(theme.visual.calendar.bujo).toBeDefined();
      expect(theme.visual.motion.activation).toBeTruthy();
    }
  });

  it("keeps calendar style independent from colorway selection", () => {
    const autumn = getSunnieTheme("autumn-golden-hour");

    expect(getCalendarPresentation(autumn, "classic")).toMatchObject({
      gridStyle: "soft",
      eventAppearance: "card",
    });
    expect(getCalendarPresentation(autumn, "bujo")).toMatchObject({
      gridStyle: "dot-grid",
      eventAppearance: "washi",
      typography: "handwritten-accent",
    });
  });

  it("validates style ids and safely falls back to Classic", () => {
    expect(CALENDAR_STYLES).toEqual(["classic", "bujo"]);
    expect(isCalendarStyleId("bujo")).toBe(true);
    expect(isCalendarStyleId("seasonal")).toBe(false);
    expect(getCalendarStyle("missing")).toBe("classic");
    expect(getSunnieTheme("missing").id).toBe("base");
  });
});
