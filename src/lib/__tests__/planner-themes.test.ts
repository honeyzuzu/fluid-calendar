import { COLOR_THEMES } from "@/lib/color-themes";
import {
  AMBIENT_MOTIONS,
  BORDER_STYLES,
  CALENDAR_ITEM_APPEARANCES,
  CALENDAR_STYLES,
  DECORATIVE_ACCENTS,
  PATTERN_STYLES,
  STICKER_PACKS,
  SUNNIE_THEMES,
  SURFACE_STYLES,
  TYPOGRAPHY_STYLES,
  VISUAL_TEST_THEME,
  WASHI_PACKS,
  WASHI_PATTERNS,
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
      expect(theme.visual.signatureDetails).toHaveLength(3);
      expect(theme.visual.assets.stickerPack).toBeTruthy();
      expect(theme.visual.assets.washiPack).toBeTruthy();
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
        "graph-paper",
        "plaid",
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
        "paper-label",
      ])
    );
    expect(WASHI_PATTERNS).toEqual(
      expect.arrayContaining([
        "plain",
        "botanical",
        "wildflower",
        "painted-stripe",
        "kraft",
        "starlight",
        "tiny-check",
      ])
    );
    expect(BORDER_STYLES).toEqual(
      expect.arrayContaining(["solid", "dashed", "hand-drawn"])
    );
    expect(TYPOGRAPHY_STYLES).toContain("handwritten-accent");
    expect(AMBIENT_MOTIONS).toEqual(
      expect.arrayContaining(["none", "petals", "leaves", "snow", "sparkle"])
    );
    expect(DECORATIVE_ACCENTS).toContain("scalloped");
  });

  it("compiles an intentionally loud test pack without calendar conditionals", () => {
    expect(getThemeDomAttributes(VISUAL_TEST_THEME, "bujo")).toMatchObject({
      colorTheme: "visual-test-theme",
      calendarGrid: "gingham",
      calendarEventAppearance: "highlight",
      calendarTaskAppearance: "sticky-note",
      calendarAllDayAppearance: "washi",
      calendarBorder: "dashed",
      calendarTypography: "handwritten-accent",
      calendarWashiPattern: "tiny-check",
      themeBorder: "dashed",
      themeRadius: "irregular",
      themeDecorativeAccent: "scalloped",
      themeTypography: "handwritten-accent",
      themeSidebarPattern: "dot-grid",
      themeStickerPack: "visual-test-leaves",
      themeMotion: "leaves",
    });
    expect(STICKER_PACKS["visual-test-leaves"].testOnly).toBe(true);
    expect(WASHI_PACKS["autumn-golden-hour"]).toContain("rust and olive plaid");
    expect(Object.keys(SUNNIE_THEMES)).not.toContain("visual-test-theme");
  });

  it("encodes the five art-directed planner worlds", () => {
    expect(SUNNIE_THEMES.base.visual).toMatchObject({
      backgroundStyle: "paper",
      surfaceStyle: "soft",
      patterns: {
        sidebar: {
          kind: "dot-grid",
          scale: 0.85,
          primaryRole: "inkSoft",
        },
      },
    });
    expect(SUNNIE_THEMES["spring-fresh-air"].visual).toMatchObject({
      decorativeAccent: "scalloped",
      patterns: {
        surface: {
          kind: "lined-paper",
          primaryRole: "border",
        },
      },
    });
    expect(
      SUNNIE_THEMES["summer-sun-kissed"].visual.calendar.bujo.gridStyle
    ).toBe("lined-paper");
    expect(
      SUNNIE_THEMES["autumn-golden-hour"].visual.calendar.bujo.taskAppearance
    ).toBe("highlight");
    expect(
      SUNNIE_THEMES["winter-candlelight-snow"].visual.calendar.classic
        .eventAppearance
    ).toBe("outline");
    expect(
      Object.values(SUNNIE_THEMES).map(
        (theme) => theme.visual.calendar.bujo.washiPattern
      )
    ).toEqual([
      "botanical",
      "kraft",
      "wildflower",
      "painted-stripe",
      "starlight",
    ]);
  });

  it("validates style ids and safely falls back to Classic", () => {
    expect(CALENDAR_STYLES).toEqual(["classic", "bujo"]);
    expect(isCalendarStyleId("bujo")).toBe(true);
    expect(isCalendarStyleId("seasonal")).toBe(false);
    expect(getCalendarStyle("missing")).toBe("classic");
    expect(getSunnieTheme("missing").id).toBe("base");
  });
});
