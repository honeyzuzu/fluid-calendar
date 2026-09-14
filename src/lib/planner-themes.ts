import {
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
  "plaid",
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

export const DECORATIVE_ACCENTS = ["none", "scalloped"] as const;

type StickerDefinition = { id: string; preview: string };
type StickerPackDefinition = {
  label: string;
  stickers: readonly StickerDefinition[];
  testOnly?: boolean;
};

export const STICKER_PACKS = {
  base: {
    label: "Sunny Garden",
    stickers: [
      { id: "garden-daisy", preview: "🌼" },
      { id: "happy-sprout", preview: "🌱" },
    ],
  },
  "spring-fresh-air": {
    label: "Fresh Air",
    stickers: [
      { id: "spring-tulip", preview: "🌷" },
      { id: "spring-bee", preview: "🐝" },
    ],
  },
  "summer-sun-kissed": {
    label: "Sun-Kissed",
    stickers: [
      { id: "summer-lemon", preview: "🍋" },
      { id: "summer-cherries", preview: "🍒" },
    ],
  },
  "autumn-golden-hour": {
    label: "Golden Hour",
    stickers: [
      { id: "autumn-leaf", preview: "🍂" },
      { id: "autumn-apple", preview: "🍎" },
    ],
  },
  "winter-candlelight-snow": {
    label: "Candlelight & Snow",
    stickers: [
      { id: "winter-snowflake", preview: "❄️" },
      { id: "winter-cocoa", preview: "☕" },
    ],
  },
  "visual-test-leaves": {
    label: "Visual test leaves",
    stickers: [
      { id: "leaf-one", preview: "🍂" },
      { id: "leaf-two", preview: "🍁" },
    ],
    testOnly: true,
  },
} as const satisfies Record<string, StickerPackDefinition>;

export const WASHI_PACKS = {
  "sunnie-sunny-garden": [
    "yellow daisy tape",
    "sage tiny-check tape",
    "cream gingham tape",
    "scalloped garden border",
    "tiny strawberry vine",
    "pastel rainbow dots",
  ],
  "spring-fresh-air": [
    "tiny pink flowers",
    "pale green gingham",
    "blue raindrops",
    "strawberry vine",
  ],
  "summer-sun-kissed": [
    "strawberry gingham",
    "lemon-yellow checks",
    "aqua waves",
    "market flowers",
  ],
  "autumn-golden-hour": [
    "rust and olive plaid",
    "tiny apples",
    "falling leaves",
    "kraft paper",
  ],
  "winter-candlelight-snow": [
    "blue graph paper",
    "cranberry bows",
    "evergreen sprigs",
    "sugar-plum stars",
  ],
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
export type DecorativeAccent = (typeof DECORATIVE_ACCENTS)[number];
export type StickerPackId = keyof typeof STICKER_PACKS;
export type WashiPackId = keyof typeof WASHI_PACKS;
export type PatternIntensity = "subtle" | "moderate" | "prominent";
export type DecorativeDensity = "minimal" | "balanced" | "maximal";
export type ThemeCoreRole = keyof ColorTheme["core"];
export type PatternSpec = {
  kind: PatternStyle;
  scale?: number;
  opacity?: number;
  rotation?: number;
  primaryRole?: ThemeCoreRole;
  secondaryRole?: ThemeCoreRole;
  lineWeight?: "hairline" | "soft" | "bold";
};

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
    app: PatternSpec;
    surface: PatternSpec;
    sidebar: PatternSpec;
  };
  borderStyle: BorderStyle;
  radiusStyle: RadiusStyle;
  decorativeAccent: DecorativeAccent;
  signatureDetails: readonly string[];
  patternIntensity: PatternIntensity;
  decorativeDensity: DecorativeDensity;
  typography: TypographyStyle;
  calendar: Record<CalendarStyleId, CalendarPresentation>;
  assets: {
    stickerPack?: StickerPackId;
    washiPack?: WashiPackId;
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

function plannerTheme(
  colorTheme: ColorTheme,
  visual: ThemeVisualDefinition,
  family: ThemeFamily = "seasonal"
): SunnieTheme<ColorThemeId> {
  return {
    ...colorTheme,
    family,
    visual,
  };
}

const defaultPlanning: ThemeVisualDefinition["planning"] = {
  rise: ["surface", "accent", "warmGlow"],
  unwind: ["surfaceRaised", "surfaceMuted", "coolGlow"],
  progress: ["accent", "primary"],
};

const pattern = (
  kind: PatternStyle,
  options: Omit<PatternSpec, "kind"> = {}
): PatternSpec => ({ kind, ...options });

/**
 * The higher-level theme registry. Color slots remain owned by color-themes.ts;
 * this layer describes how components present those colors. Components consume
 * these semantic variants and never branch on a theme id.
 */
export const SUNNIE_THEMES: Record<ColorThemeId, SunnieTheme<ColorThemeId>> = {
  base: plannerTheme(
    COLOR_THEMES.base,
    {
      backgroundStyle: "paper",
      surfaceStyle: "soft",
      patterns: {
        app: pattern("none"),
        surface: pattern("none"),
        sidebar: pattern("dot-grid", {
          scale: 0.85,
          opacity: 0.14,
          primaryRole: "inkSoft",
          lineWeight: "hairline",
        }),
      },
      borderStyle: "solid",
      radiusStyle: "round",
      decorativeAccent: "none",
      signatureDetails: ["daisies", "soft paper", "tiny checks"],
      patternIntensity: "subtle",
      decorativeDensity: "minimal",
      typography: "soft",
      calendar: {
        classic: classicPresentation,
        bujo: {
          gridStyle: "dot-grid",
          eventAppearance: "highlight",
          taskAppearance: "sticky-note",
          allDayAppearance: "washi",
          borderStyle: "hand-drawn",
          typography: "handwritten-accent",
        },
      },
      assets: {
        stickerPack: "base",
        washiPack: "sunnie-sunny-garden",
        illustrationPack: "sunnie-garden-doodles",
      },
      motion: { activation: "sprout" },
      planning: defaultPlanning,
    },
    "special"
  ),
  "autumn-golden-hour": plannerTheme(COLOR_THEMES["autumn-golden-hour"], {
    backgroundStyle: "paper",
    surfaceStyle: "paper",
    patterns: {
      app: pattern("none"),
      surface: pattern("dot-grid", {
        scale: 1.1,
        opacity: 0.16,
        primaryRole: "primary",
      }),
      sidebar: pattern("none"),
    },
    borderStyle: "hand-drawn",
    radiusStyle: "soft",
    decorativeAccent: "none",
    signatureDetails: ["kraft paper", "plaid accents", "washi tape"],
    patternIntensity: "moderate",
    decorativeDensity: "balanced",
    typography: "handwritten-accent",
    calendar: {
      classic: { ...classicPresentation, typography: "soft" },
      bujo: {
        gridStyle: "dot-grid",
        eventAppearance: "washi",
        taskAppearance: "highlight",
        allDayAppearance: "washi",
        borderStyle: "hand-drawn",
        typography: "handwritten-accent",
      },
    },
    assets: {
      stickerPack: "autumn-golden-hour",
      washiPack: "autumn-golden-hour",
      illustrationPack: "autumn-orchard-doodles",
    },
    motion: { activation: "leaves" },
    planning: {
      ...defaultPlanning,
      progress: ["warmGlow", "primary"],
    },
  }),
  "spring-fresh-air": plannerTheme(COLOR_THEMES["spring-fresh-air"], {
    backgroundStyle: "paper",
    surfaceStyle: "paper",
    patterns: {
      app: pattern("none"),
      surface: pattern("lined-paper", {
        scale: 1.05,
        opacity: 0.22,
        primaryRole: "border",
        lineWeight: "hairline",
      }),
      sidebar: pattern("none"),
    },
    borderStyle: "hand-drawn",
    radiusStyle: "soft",
    decorativeAccent: "scalloped",
    signatureDetails: ["tiny florals", "scalloped accents", "notebook paper"],
    patternIntensity: "subtle",
    decorativeDensity: "balanced",
    typography: "handwritten-accent",
    calendar: {
      classic: {
        ...classicPresentation,
        allDayAppearance: "highlight",
        typography: "soft",
      },
      bujo: {
        gridStyle: "lined-paper",
        eventAppearance: "highlight",
        taskAppearance: "washi",
        allDayAppearance: "washi",
        borderStyle: "hand-drawn",
        typography: "handwritten-accent",
      },
    },
    assets: {
      stickerPack: "spring-fresh-air",
      washiPack: "spring-fresh-air",
      illustrationPack: "spring-garden-doodles",
    },
    motion: { activation: "petals" },
    planning: {
      ...defaultPlanning,
      progress: ["coolGlow", "primary"],
    },
  }),
  "summer-sun-kissed": plannerTheme(COLOR_THEMES["summer-sun-kissed"], {
    backgroundStyle: "ambient",
    surfaceStyle: "soft",
    patterns: {
      app: pattern("none"),
      surface: pattern("gingham", {
        scale: 1.15,
        opacity: 0.12,
        primaryRole: "accent",
        secondaryRole: "primary",
      }),
      sidebar: pattern("none"),
    },
    borderStyle: "solid",
    radiusStyle: "round",
    decorativeAccent: "none",
    signatureDetails: ["gingham", "fruit", "sunny checks"],
    patternIntensity: "prominent",
    decorativeDensity: "balanced",
    typography: "soft",
    calendar: {
      classic: {
        ...classicPresentation,
        allDayAppearance: "highlight",
        typography: "soft",
      },
      bujo: {
        gridStyle: "gingham",
        eventAppearance: "highlight",
        taskAppearance: "sticky-note",
        allDayAppearance: "washi",
        borderStyle: "hand-drawn",
        typography: "handwritten-accent",
      },
    },
    assets: {
      stickerPack: "summer-sun-kissed",
      washiPack: "summer-sun-kissed",
      illustrationPack: "summer-market-doodles",
    },
    motion: { activation: "sun-shimmer" },
    planning: defaultPlanning,
  }),
  "winter-candlelight-snow": plannerTheme(
    COLOR_THEMES["winter-candlelight-snow"],
    {
      backgroundStyle: "ambient",
      surfaceStyle: "paper",
      patterns: {
        app: pattern("none"),
        surface: pattern("graph-paper", {
          scale: 0.95,
          opacity: 0.11,
          primaryRole: "inkSoft",
          lineWeight: "hairline",
        }),
        sidebar: pattern("none"),
      },
      borderStyle: "solid",
      radiusStyle: "soft",
      decorativeAccent: "none",
      signatureDetails: ["graph paper", "outlined notes", "frosted edges"],
      patternIntensity: "subtle",
      decorativeDensity: "balanced",
      typography: "handwritten-accent",
      calendar: {
        classic: {
          ...classicPresentation,
          eventAppearance: "outline",
          typography: "soft",
        },
        bujo: {
          gridStyle: "graph-paper",
          eventAppearance: "outline",
          taskAppearance: "sticky-note",
          allDayAppearance: "washi",
          borderStyle: "hand-drawn",
          typography: "handwritten-accent",
        },
      },
      assets: {
        stickerPack: "winter-candlelight-snow",
        washiPack: "winter-candlelight-snow",
        illustrationPack: "winter-candlelight-doodles",
      },
      motion: { activation: "snow" },
      planning: {
        ...defaultPlanning,
        unwind: ["surfaceRaised", "coolGlow", "primary"],
      },
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
    patterns: {
      app: pattern("stripes", {
        opacity: 0.18,
        rotation: 25,
        primaryRole: "accent",
      }),
      surface: pattern("checker", {
        scale: 1.25,
        opacity: 0.3,
        primaryRole: "surfaceMuted",
      }),
      sidebar: pattern("dot-grid", {
        scale: 0.75,
        opacity: 0.24,
        primaryRole: "primary",
        lineWeight: "bold",
      }),
    },
    borderStyle: "dashed",
    decorativeAccent: "scalloped",
    signatureDetails: ["primitive coverage", "high contrast", "lab only"],
    patternIntensity: "prominent",
    decorativeDensity: "maximal",
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
  | "themeDecorativeAccent"
  | "themePatternIntensity"
  | "themeDecorativeDensity"
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
    themeDecorativeAccent: theme.visual.decorativeAccent,
    themePatternIntensity: theme.visual.patternIntensity,
    themeDecorativeDensity: theme.visual.decorativeDensity,
    themeTypography: theme.visual.typography,
    themeAppPattern: theme.visual.patterns.app.kind,
    themeSurfacePattern: theme.visual.patterns.surface.kind,
    themeSidebarPattern: theme.visual.patterns.sidebar.kind,
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
  const patternVariables = (
    target: "app" | "surface" | "sidebar",
    spec: PatternSpec
  ) => {
    const lineWeights = { hairline: 0.75, soft: 1, bold: 1.5 } as const;
    return {
      [`--sunnie-${target}-pattern-scale`]: String(spec.scale ?? 1),
      [`--sunnie-${target}-pattern-opacity`]: `${Math.round(
        (spec.opacity ?? 0.14) * 100
      )}%`,
      [`--sunnie-${target}-pattern-rotation`]: `${spec.rotation ?? 0}deg`,
      [`--sunnie-${target}-pattern-primary`]: resolve(
        spec.primaryRole ?? "accent"
      ),
      [`--sunnie-${target}-pattern-secondary`]: resolve(
        spec.secondaryRole ?? "primary"
      ),
      [`--sunnie-${target}-pattern-line`]: `${lineWeights[spec.lineWeight ?? "soft"]}px`,
    };
  };
  return {
    "--sunnie-rise-from": resolve(theme.visual.planning.rise[0]),
    "--sunnie-rise-via": resolve(theme.visual.planning.rise[1]),
    "--sunnie-rise-to": resolve(theme.visual.planning.rise[2]),
    "--sunnie-unwind-from": resolve(theme.visual.planning.unwind[0]),
    "--sunnie-unwind-via": resolve(theme.visual.planning.unwind[1]),
    "--sunnie-unwind-to": resolve(theme.visual.planning.unwind[2]),
    "--sunnie-progress-from": resolve(theme.visual.planning.progress[0]),
    "--sunnie-progress-to": resolve(theme.visual.planning.progress[1]),
    ...patternVariables("app", theme.visual.patterns.app),
    ...patternVariables("surface", theme.visual.patterns.surface),
    ...patternVariables("sidebar", theme.visual.patterns.sidebar),
  };
}
