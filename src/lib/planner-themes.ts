import {
  BASE_COLOR_THEME,
  COLOR_THEMES,
  ColorTheme,
  ColorThemeId,
  getColorTheme,
} from "@/lib/color-themes";

export const CALENDAR_STYLES = ["classic", "bujo"] as const;

export type CalendarStyleId = (typeof CALENDAR_STYLES)[number];
export type ThemeFamily = "original" | "seasonal" | "character" | "special";
export type AppBackgroundStyle = "ambient" | "paper";
export type SurfaceStyle = "clean" | "paper" | "glass";
export type BorderStyle = "solid" | "hand-drawn";
export type RadiusStyle = "soft" | "round" | "irregular";
export type TypographyStyle = "default" | "soft" | "handwritten-accent";
export type CalendarGridStyle =
  | "soft"
  | "dot-grid"
  | "lined-paper"
  | "graph-paper";
export type CalendarItemAppearance =
  | "card"
  | "marker"
  | "washi"
  | "sticky-note"
  | "outline";
export type AmbientMotion =
  | "none"
  | "sprout"
  | "petals"
  | "sun-shimmer"
  | "falling-leaves"
  | "snow";
export type ThemeCoreRole = keyof ColorTheme["core"];

export type CalendarPresentation = {
  gridStyle: CalendarGridStyle;
  eventAppearance: CalendarItemAppearance;
  taskAppearance: CalendarItemAppearance;
  borderStyle: BorderStyle;
  typography: TypographyStyle;
};

export type ThemeVisualDefinition = {
  backgroundStyle: AppBackgroundStyle;
  surfaceStyle: SurfaceStyle;
  borderStyle: BorderStyle;
  radiusStyle: RadiusStyle;
  typography: TypographyStyle;
  calendar: Record<CalendarStyleId, CalendarPresentation>;
  assets: {
    stickerPack?: string;
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

export type SunnieTheme = ColorTheme & {
  family: ThemeFamily;
  visual: ThemeVisualDefinition;
};

const classicPresentation: CalendarPresentation = {
  gridStyle: "soft",
  eventAppearance: "card",
  taskAppearance: "card",
  borderStyle: "solid",
  typography: "default",
};

function seasonalTheme(
  colorTheme: ColorTheme,
  activation: AmbientMotion,
  bujo: Pick<
    CalendarPresentation,
    "gridStyle" | "eventAppearance" | "taskAppearance"
  >
): SunnieTheme {
  return {
    ...colorTheme,
    family: colorTheme.id === BASE_COLOR_THEME.id ? "original" : "seasonal",
    visual: {
      backgroundStyle: "ambient",
      surfaceStyle: "clean",
      borderStyle: "solid",
      radiusStyle: "round",
      typography: "soft",
      calendar: {
        classic: classicPresentation,
        bujo: {
          ...bujo,
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
export const SUNNIE_THEMES: Record<ColorThemeId, SunnieTheme> = {
  base: seasonalTheme(COLOR_THEMES.base, "sprout", {
    gridStyle: "dot-grid",
    eventAppearance: "marker",
    taskAppearance: "sticky-note",
  }),
  "autumn-golden-hour": seasonalTheme(
    COLOR_THEMES["autumn-golden-hour"],
    "falling-leaves",
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
      eventAppearance: "marker",
      taskAppearance: "sticky-note",
    }
  ),
  "summer-sun-kissed": seasonalTheme(
    COLOR_THEMES["summer-sun-kissed"],
    "sun-shimmer",
    {
      gridStyle: "lined-paper",
      eventAppearance: "marker",
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

export function isCalendarStyleId(value: unknown): value is CalendarStyleId {
  return (
    typeof value === "string" &&
    (CALENDAR_STYLES as readonly string[]).includes(value)
  );
}

export function getCalendarStyle(value: unknown): CalendarStyleId {
  return isCalendarStyleId(value) ? value : "classic";
}

export function getSunnieTheme(value: unknown): SunnieTheme {
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
