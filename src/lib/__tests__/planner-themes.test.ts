import { COLOR_THEMES } from "@/lib/color-themes";
import {
  AMBIENT_MOTIONS,
  BORDER_STYLES,
  CALENDAR_ITEM_APPEARANCES,
  CALENDAR_STYLES,
  PATTERN_STYLES,
  STICKER_PACKS,
  SUNNIE_THEMES,
  SURFACE_STYLES,
  SunnieTheme,
  TYPOGRAPHY_STYLES,
  getCalendarPresentation,
  getCalendarStyle,
  getSunnieTheme,
  getThemeDomAttributes,
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
      eventAppearance: "soft",
    });
    expect(getCalendarPresentation(autumn, "bujo")).toMatchObject({
      gridStyle: "dot-grid",
      eventAppearance: "washi",
      typography: "handwritten-accent",
    });
  });

  it("exposes reusable primitives rather than theme-specific rendering values", () => {
    expect(PATTERN_STYLES).toEqual(
      expect.arrayContaining([
        "none",
        "gingham",
        "dot-grid",
        "lined-paper",
        "checker",
        "stripes",
      ])
    );
    expect(SURFACE_STYLES).toEqual(
      expect.arrayContaining(["clean", "paper", "soft", "patterned", "glass"])
    );
    expect(CALENDAR_ITEM_APPEARANCES).toEqual(
      expect.arrayContaining([
        "solid",
        "soft",
        "highlight",
        "outline",
        "washi",
        "sticky-note",
      ])
    );
    expect(BORDER_STYLES).toEqual(
      expect.arrayContaining(["solid", "dashed", "hand-drawn"])
    );
    expect(TYPOGRAPHY_STYLES).toContain("handwritten-accent");
    expect(AMBIENT_MOTIONS).toEqual(
      expect.arrayContaining(["none", "petals", "leaves", "snow", "sparkle"])
    );
  });

  it("compiles an intentionally loud test pack without calendar conditionals", () => {
    const base = SUNNIE_THEMES.base;
    const visualTestTheme: SunnieTheme<"visual-test-theme"> = {
      ...base,
      id: "visual-test-theme",
      name: "Visual Test Theme",
      family: "special",
      visual: {
        ...base.visual,
        surfaceStyle: "patterned",
        patterns: { app: "stripes", surface: "checker", sidebar: "dot-grid" },
        borderStyle: "dashed",
        typography: "handwritten-accent",
        calendar: {
          ...base.visual.calendar,
          bujo: {
            gridStyle: "gingham",
            eventAppearance: "highlight",
            taskAppearance: "sticky-note",
            allDayAppearance: "washi",
            borderStyle: "dashed",
            typography: "handwritten-accent",
          },
        },
        assets: { stickerPack: "visual-test-leaves" },
        motion: { activation: "leaves" },
      },
    };

    expect(getThemeDomAttributes(visualTestTheme, "bujo")).toMatchObject({
      colorTheme: "visual-test-theme",
      calendarGrid: "gingham",
      calendarEventAppearance: "highlight",
      calendarTaskAppearance: "sticky-note",
      calendarAllDayAppearance: "washi",
      calendarBorder: "dashed",
      calendarTypography: "handwritten-accent",
      themeBorder: "dashed",
      themeRadius: "round",
      themeTypography: "handwritten-accent",
      themeSidebarPattern: "dot-grid",
      themeStickerPack: "visual-test-leaves",
      themeMotion: "leaves",
    });
    expect(STICKER_PACKS["visual-test-leaves"].testOnly).toBe(true);
    expect(Object.keys(SUNNIE_THEMES)).not.toContain("visual-test-theme");
  });

  it("validates style ids and safely falls back to Classic", () => {
    expect(CALENDAR_STYLES).toEqual(["classic", "bujo"]);
    expect(isCalendarStyleId("bujo")).toBe(true);
    expect(isCalendarStyleId("seasonal")).toBe(false);
    expect(getCalendarStyle("missing")).toBe("classic");
    expect(getSunnieTheme("missing").id).toBe("base");
  });
});
