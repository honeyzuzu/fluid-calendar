import {
  BASE_COLOR_THEME,
  COLOR_THEMES,
  ColorTheme,
  ColorThemeId,
  getColorTheme,
} from "@/lib/color-themes";

export const CALENDAR_STYLES = ["classic", "bujo"] as const;
export const PATTERN_STYLES = [
  "none",
  "gingham",
  "dot-grid",
  "lined-paper",
  "checker",
  "stripes",
  "graph-paper",
] as const;
export const SURFACE_STYLES = [
  "clean",
  "paper",
  "soft",
  "patterned",
  "glass",
] as const;
export const CALENDAR_ITEM_APPEARANCES = [
  "solid",
  "soft",
  "highlight",
  "outline",
  "washi",
  "sticky-note",
] as const;
export const BORDER_STYLES = ["solid", "dashed", "hand-drawn"] as const;
export const TYPOGRAPHY_STYLES = [
  "normal",
  "soft",
  "handwritten-accent",
] as const;
export const AMBIENT_MOTIONS = [
  "none",
  "sprout",
  "petals",
  "leaves",
  "sun-shimmer",
  "snow",
  "sparkle",
] as const;

export const STICKER_PACKS = {
  "visual-test-leaves": {
    label: "Visual test leaves",
    stickers: [
      { id: "leaf-one", preview: "🍂" },
      { id: "leaf-two", preview: "🍁" },
    ],
    testOnly: true,
  },
} as const;

export type CalendarStyleId = (typeof CALENDAR_STYLES)[number];
export type ThemeFamily = "original" | "seasonal" | "character" | "special";
export type AppBackgroundStyle = "ambient" | "paper";
export type PatternStyle = (typeof PATTERN_STYLES)[number];
export type SurfaceStyle = (typeof SURFACE_STYLES)[number];
export type BorderStyle = (typeof BORDER_STYLES)[number];
export type RadiusStyle = "soft" | "round" | "irregular";
export type TypographyStyle = (typeof TYPOGRAPHY_STYLES)[number];
export type CalendarGridStyle = "soft" | Exclude<PatternStyle, "none">;
export type CalendarItemAppearance = (typeof CALENDAR_ITEM_APPEARANCES)[number];
export type AmbientMotion = (typeof AMBIENT_MOTIONS)[number];
export type StickerPackId = keyof typeof STICKER_PACKS;
export type ThemeCoreRole = keyof ColorTheme["core"];

export type CalendarPresentation = {
  gridStyle: CalendarGridStyle;
  eventAppearance: CalendarItemAppearance;
  taskAppearance: CalendarItemAppearance;
  allDayAppearance: CalendarItemAppearance;
  borderStyle: BorderStyle;
  typography: TypographyStyle;
};

export type ThemeVisualDefinition = {
  backgroundStyle: AppBackgroundStyle;
  surfaceStyle: SurfaceStyle;
  patterns: {
    app: PatternStyle;
    surface: PatternStyle;
    sidebar: PatternStyle;
  };
  borderStyle: BorderStyle;
  radiusStyle: RadiusStyle;
  typography: TypographyStyle;
  calendar: Record<CalendarStyleId, CalendarPresentation>;
  assets: {
    stickerPack?: StickerPackId;
    illustrationPack?: string;
  };
  motion: {
    activation: AmbientMotion;
  };
  planning: {
    rise: [ThemeCoreRole, ThemeCoreRole, ThemeCoreRole];
    unwind: [ThemeCoreRole, ThemeCoreRole, ThemeCoreRole];
    progress: [ThemeCoreRole, ThemeCoreRole];
  };
};

export type SunnieTheme<ThemeId extends string = string> = Omit<
  ColorTheme,
  "id"
> & {
  id: ThemeId;
  family: ThemeFamily;
  visual: ThemeVisualDefinition;
};

const classicPresentation: CalendarPresentation = {
  gridStyle: "soft",
  eventAppearance: "soft",
  taskAppearance: "soft",
  allDayAppearance: "soft",
  borderStyle: "solid",
  typography: "normal",
};

function seasonalTheme(
  colorTheme: ColorTheme,
  activation: AmbientMotion,
  bujo: Pick<
    CalendarPresentation,
    "gridStyle" | "eventAppearance" | "taskAppearance"
  >
): SunnieTheme<ColorThemeId> {
  return {
    ...colorTheme,
    family: colorTheme.id === BASE_COLOR_THEME.id ? "original" : "seasonal",
    visual: {
      backgroundStyle: "ambient",
      surfaceStyle: "clean",
      patterns: { app: "none", surface: "none", sidebar: "none" },
      borderStyle: "solid",
      radiusStyle: "round",
      typography: "soft",
      calendar: {
        classic: classicPresentation,
        bujo: {
          ...bujo,
          allDayAppearance: "washi",
          borderStyle: "hand-drawn",
          typography: "handwritten-accent",
        },
      },
      assets: {},
      motion: { activation },
      planning: {
        rise: ["surface", "accent", "warmGlow"],
        unwind: ["surfaceRaised", "surfaceMuted", "coolGlow"],
        progress: ["accent", "primary"],
      },
    },
  };
}

/**
 * The higher-level theme registry. Color slots remain owned by color-themes.ts;
 * this layer describes how components present those colors. Components consume
 * these semantic variants and never branch on a theme id.
 */
export const SUNNIE_THEMES: Record<ColorThemeId, SunnieTheme<ColorThemeId>> = {
  base: seasonalTheme(COLOR_THEMES.base, "sprout", {
    gridStyle: "dot-grid",
    eventAppearance: "highlight",
    taskAppearance: "sticky-note",
  }),
  "autumn-golden-hour": seasonalTheme(
    COLOR_THEMES["autumn-golden-hour"],
    "leaves",
    {
      gridStyle: "dot-grid",
      eventAppearance: "washi",
      taskAppearance: "sticky-note",
    }
  ),
  "spring-fresh-air": seasonalTheme(
    COLOR_THEMES["spring-fresh-air"],
    "petals",
    {
      gridStyle: "dot-grid",
      eventAppearance: "highlight",
      taskAppearance: "sticky-note",
    }
  ),
  "summer-sun-kissed": seasonalTheme(
    COLOR_THEMES["summer-sun-kissed"],
    "sun-shimmer",
    {
      gridStyle: "lined-paper",
      eventAppearance: "highlight",
      taskAppearance: "washi",
    }
  ),
  "winter-candlelight-snow": seasonalTheme(
    COLOR_THEMES["winter-candlelight-snow"],
    "snow",
    {
      gridStyle: "graph-paper",
      eventAppearance: "outline",
      taskAppearance: "sticky-note",
    }
  ),
};

/**
 * Deliberately loud, non-persistable pack used by tests and the admin Theme Lab.
 * It exercises the visual contract without becoming a normal Settings choice.
 */
export const VISUAL_TEST_THEME: SunnieTheme<"visual-test-theme"> = {
  ...SUNNIE_THEMES.base,
  id: "visual-test-theme",
  name: "Visual Test Theme",
  description:
    "A loud laboratory pack that makes each visual primitive easy to inspect.",
  family: "special",
  visual: {
    ...SUNNIE_THEMES.base.visual,
    surfaceStyle: "patterned",
    patterns: { app: "stripes", surface: "checker", sidebar: "dot-grid" },
    borderStyle: "dashed",
    typography: "handwritten-accent",
    calendar: {
      classic: {
        gridStyle: "checker",
        eventAppearance: "solid",
        taskAppearance: "soft",
        allDayAppearance: "highlight",
        borderStyle: "dashed",
        typography: "normal",
      },
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

export const THEME_LAB_THEMES = {
  ...SUNNIE_THEMES,
  [VISUAL_TEST_THEME.id]: VISUAL_TEST_THEME,
} as const;

export type ThemeLabThemeId = keyof typeof THEME_LAB_THEMES;

export type ThemeDomAttributes = Record<
  | "colorTheme"
  | "calendarStyle"
  | "calendarGrid"
  | "calendarEventAppearance"
  | "calendarTaskAppearance"
  | "calendarAllDayAppearance"
  | "calendarBorder"
  | "calendarTypography"
  | "themeBackground"
  | "themeSurface"
  | "themeBorder"
  | "themeRadius"
  | "themeTypography"
  | "themeAppPattern"
  | "themeSurfacePattern"
  | "themeSidebarPattern"
  | "themeMotion"
  | "themeStickerPack",
  string
>;

/** Compile a pack into generic presentation attributes for the rendering layer. */
export function getThemeDomAttributes(
  theme: SunnieTheme,
  calendarStyle: unknown
): ThemeDomAttributes {
  const style = getCalendarStyle(calendarStyle);
  const calendar = getCalendarPresentation(theme, style);
  return {
    colorTheme: theme.id,
    calendarStyle: style,
    calendarGrid: calendar.gridStyle,
    calendarEventAppearance: calendar.eventAppearance,
    calendarTaskAppearance: calendar.taskAppearance,
    calendarAllDayAppearance: calendar.allDayAppearance,
    calendarBorder: calendar.borderStyle,
    calendarTypography: calendar.typography,
    themeBackground: theme.visual.backgroundStyle,
    themeSurface: theme.visual.surfaceStyle,
    themeBorder: theme.visual.borderStyle,
    themeRadius: theme.visual.radiusStyle,
    themeTypography: theme.visual.typography,
    themeAppPattern: theme.visual.patterns.app,
    themeSurfacePattern: theme.visual.patterns.surface,
    themeSidebarPattern: theme.visual.patterns.sidebar,
    themeMotion: theme.visual.motion.activation,
    themeStickerPack: theme.visual.assets.stickerPack ?? "none",
  };
}

export function isCalendarStyleId(value: unknown): value is CalendarStyleId {
  return (
    typeof value === "string" &&
    (CALENDAR_STYLES as readonly string[]).includes(value)
  );
}

export function getCalendarStyle(value: unknown): CalendarStyleId {
  return isCalendarStyleId(value) ? value : "classic";
}

export function getSunnieTheme(value: unknown): SunnieTheme<ColorThemeId> {
  const colorTheme = getColorTheme(value);
  return SUNNIE_THEMES[colorTheme.id];
}

export function getCalendarPresentation(
  theme: SunnieTheme,
  calendarStyle: unknown
): CalendarPresentation {
  return theme.visual.calendar[getCalendarStyle(calendarStyle)];
}

export function getPlannerThemeCssVariables(
  theme: SunnieTheme
): Record<string, string> {
  const resolve = (role: ThemeCoreRole) => theme.core[role];
  return {
    "--sunnie-rise-from": resolve(theme.visual.planning.rise[0]),
    "--sunnie-rise-via": resolve(theme.visual.planning.rise[1]),
    "--sunnie-rise-to": resolve(theme.visual.planning.rise[2]),
    "--sunnie-unwind-from": resolve(theme.visual.planning.unwind[0]),
    "--sunnie-unwind-via": resolve(theme.visual.planning.unwind[1]),
    "--sunnie-unwind-to": resolve(theme.visual.planning.unwind[2]),
    "--sunnie-progress-from": resolve(theme.visual.planning.progress[0]),
    "--sunnie-progress-to": resolve(theme.visual.planning.progress[1]),
  };
}
