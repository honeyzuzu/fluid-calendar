import { getReadableTextColor } from "@/lib/color-contrast";

export const COLOR_THEME_CORE_ROLES = [
  "canvas",
  "surface",
  "surfaceRaised",
  "surfaceMuted",
  "ink",
  "inkSoft",
  "inkMuted",
  "border",
  "primary",
  "onPrimary",
  "accent",
  "onAccent",
  "warmGlow",
  "coolGlow",
] as const;

export const COLOR_THEME_PALETTE_SIZES = {
  events: 8,
  projects: 6,
  tasks: 6,
  friends: 6,
  statuses: 4,
} as const;

export const COLOR_THEME_HEX_COUNT =
  COLOR_THEME_CORE_ROLES.length +
  Object.values(COLOR_THEME_PALETTE_SIZES).reduce(
    (total, size) => total + size,
    0
  );

export type ColorThemeCoreRole = (typeof COLOR_THEME_CORE_ROLES)[number];
export type ColorThemeId = "base" | "autumn-golden-hour";
export type ColorThemePaletteName = keyof typeof COLOR_THEME_PALETTE_SIZES;

export type ColorThemeSwatch = {
  id: string;
  name: string;
  value: string;
};

export type ColorTheme = {
  id: ColorThemeId;
  name: string;
  description: string;
  core: Record<ColorThemeCoreRole, string>;
  palettes: {
    events: readonly ColorThemeSwatch[];
    projects: readonly ColorThemeSwatch[];
    tasks: readonly ColorThemeSwatch[];
    friends: readonly ColorThemeSwatch[];
    statuses: readonly ColorThemeSwatch[];
  };
};

export const BASE_COLOR_THEME: ColorTheme = {
  id: "base",
  name: "Sunnie Base",
  description: "The original warm cream, sunshine, and garden colorway.",
  core: {
    canvas: "#FFF9E8",
    surface: "#FFFDF5",
    surfaceRaised: "#FFFAF0",
    surfaceMuted: "#EEF3DF",
    ink: "#3F432E",
    inkSoft: "#5F6848",
    inkMuted: "#74785F",
    border: "#DFE2C8",
    primary: "#64734A",
    onPrimary: "#FFF9E8",
    accent: "#F8E4A1",
    onAccent: "#77591D",
    warmGlow: "#F8C95D",
    coolGlow: "#B8D98B",
  },
  palettes: {
    events: [
      { id: "event-1", name: "Cloud Blue", value: "#9BC7D9" },
      { id: "event-2", name: "Soft Denim", value: "#7397C7" },
      { id: "event-3", name: "Periwinkle", value: "#A7ACE0" },
      { id: "event-4", name: "Sea Glass", value: "#78B8B3" },
      { id: "event-5", name: "Dusty Sage", value: "#7F9B83" },
      { id: "event-6", name: "Apricot", value: "#E9A66F" },
      { id: "event-7", name: "Clay", value: "#C98772" },
      { id: "event-8", name: "Cocoa Mauve", value: "#9B7A86" },
    ],
    projects: [
      { id: "project-1", name: "Honey", value: "#F4D27D" },
      { id: "project-2", name: "Apricot", value: "#F2BE8F" },
      { id: "project-3", name: "Rose Clay", value: "#DFA7A7" },
      { id: "project-4", name: "Meadow", value: "#BDD39A" },
      { id: "project-5", name: "Oat", value: "#DFCDA6" },
      { id: "project-6", name: "Soft Moss", value: "#AFC28D" },
    ],
    tasks: [
      { id: "task-1", name: "Peach", value: "#F7BEB5" },
      { id: "task-2", name: "Sunbeam", value: "#F9DA94" },
      { id: "task-3", name: "Mint", value: "#C1E0CB" },
      { id: "task-4", name: "Lavender", value: "#D9CFEE" },
      { id: "task-5", name: "Sky", value: "#C6DCEB" },
      { id: "task-6", name: "Oat", value: "#E7DFC5" },
    ],
    friends: [
      { id: "friend-1", name: "Lavender Mist", value: "#D7CBEA" },
      { id: "friend-2", name: "Powder Blue", value: "#C6DCEB" },
      { id: "friend-3", name: "Blush Cloud", value: "#EBCBD7" },
      { id: "friend-4", name: "Peach Cream", value: "#F0D0B7" },
      { id: "friend-5", name: "Misty Teal", value: "#C5DEDA" },
      { id: "friend-6", name: "Periwinkle", value: "#CBD1EE" },
    ],
    statuses: [
      { id: "success", name: "Success", value: "#84A75E" },
      { id: "warning", name: "Warning", value: "#D99E33" },
      { id: "danger", name: "Danger", value: "#C9705C" },
      { id: "info", name: "Information", value: "#7397C7" },
    ],
  },
};

export const AUTUMN_GOLDEN_HOUR_THEME: ColorTheme = {
  id: "autumn-golden-hour",
  name: "Autumn — Golden Hour",
  description:
    "A cozy autumn afternoon moving from the apple orchard to warm drinks by the fire.",
  core: {
    canvas: "#F6F0E4",
    surface: "#FCF8F0",
    surfaceRaised: "#FFF9EF",
    surfaceMuted: "#E5E2D3",
    ink: "#40372F",
    inkSoft: "#625E4D",
    inkMuted: "#82786D",
    border: "#D9CDBD",
    primary: "#59634B",
    onPrimary: "#FFF9EF",
    accent: "#E5B85C",
    onAccent: "#5A421E",
    warmGlow: "#E8A34D",
    coolGlow: "#91A1A5",
  },
  palettes: {
    events: [
      { id: "event-1", name: "Green Apple", value: "#8FA05A" },
      { id: "event-2", name: "Apple Basket", value: "#C94F3D" },
      { id: "event-3", name: "Orchard Red", value: "#8E3F36" },
      { id: "event-4", name: "Blue Jean", value: "#667D8A" },
      { id: "event-5", name: "Golden Apple", value: "#D6A84B" },
      { id: "event-6", name: "Cider", value: "#C77C43" },
      { id: "event-7", name: "Orchard Grass", value: "#667255" },
      { id: "event-8", name: "Apple Blossom", value: "#C98D91" },
    ],
    projects: [
      { id: "project-1", name: "Pumpkin", value: "#D97836" },
      { id: "project-2", name: "Butternut", value: "#E4A65C" },
      { id: "project-3", name: "Hay Bale", value: "#D3B66E" },
      { id: "project-4", name: "Pumpkin Vine", value: "#7A8052" },
      { id: "project-5", name: "Terracotta Pot", value: "#B96547" },
      { id: "project-6", name: "Patch Soil", value: "#92715D" },
    ],
    tasks: [
      { id: "task-1", name: "Maple", value: "#C87967" },
      { id: "task-2", name: "Ginkgo", value: "#DCB968" },
      { id: "task-3", name: "Faded Fern", value: "#A7AA7A" },
      { id: "task-4", name: "Russet", value: "#B47A59" },
      { id: "task-5", name: "Dusky Plum", value: "#A18691" },
      { id: "task-6", name: "Fallen Oak", value: "#C2A98A" },
    ],
    friends: [
      { id: "friend-1", name: "Mulled Wine", value: "#9B6670" },
      { id: "friend-2", name: "Cocoa Cream", value: "#C8AA8D" },
      { id: "friend-3", name: "Butterscotch", value: "#D39B5E" },
      { id: "friend-4", name: "Sweater Sage", value: "#92937A" },
      { id: "friend-5", name: "Dusty Orchid", value: "#A895A7" },
      { id: "friend-6", name: "Soft Denim", value: "#8294A1" },
    ],
    statuses: [
      { id: "success", name: "Moss Green", value: "#668255" },
      { id: "warning", name: "Amber", value: "#C98A32" },
      { id: "danger", name: "Brick Red", value: "#B65D50" },
      { id: "info", name: "Denim Blue", value: "#617F98" },
    ],
  },
};

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  base: BASE_COLOR_THEME,
  "autumn-golden-hour": AUTUMN_GOLDEN_HOUR_THEME,
};

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === "string" && value in COLOR_THEMES;
}

export function getColorTheme(value: unknown): ColorTheme {
  return isColorThemeId(value) ? COLOR_THEMES[value] : BASE_COLOR_THEME;
}

function hexToHslChannels(hex: string) {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta) {
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
    if (max === green) hue = (blue - red) / delta + 2;
    if (max === blue) hue = (red - green) / delta + 4;
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

export function getColorThemeCssVariables(theme: ColorTheme) {
  const status = Object.fromEntries(
    theme.palettes.statuses.map((swatch) => [swatch.id, swatch.value])
  );
  const event = theme.palettes.events;

  return {
    "--background": hexToHslChannels(theme.core.canvas),
    "--foreground": hexToHslChannels(theme.core.ink),
    "--card": hexToHslChannels(theme.core.surface),
    "--card-foreground": hexToHslChannels(theme.core.ink),
    "--popover": hexToHslChannels(theme.core.surfaceRaised),
    "--popover-foreground": hexToHslChannels(theme.core.ink),
    "--primary": hexToHslChannels(theme.core.primary),
    "--primary-foreground": hexToHslChannels(theme.core.onPrimary),
    "--secondary": hexToHslChannels(theme.core.surfaceMuted),
    "--secondary-foreground": hexToHslChannels(theme.core.inkSoft),
    "--muted": hexToHslChannels(theme.core.surfaceMuted),
    // Small muted labels require normal-text contrast. inkMuted remains
    // available for larger/decorative uses through --sunnie-ink-muted.
    "--muted-foreground": hexToHslChannels(theme.core.inkSoft),
    "--accent": hexToHslChannels(theme.core.accent),
    "--accent-foreground": hexToHslChannels(theme.core.onAccent),
    "--destructive": hexToHslChannels(status.danger),
    "--destructive-foreground": hexToHslChannels(
      getReadableTextColor(status.danger)
    ),
    "--warning": hexToHslChannels(status.warning),
    "--warning-foreground": hexToHslChannels(
      getReadableTextColor(status.warning)
    ),
    "--border": hexToHslChannels(theme.core.border),
    "--input": hexToHslChannels(theme.core.border),
    "--ring": hexToHslChannels(theme.core.primary),
    "--chart-1": hexToHslChannels(event[5].value),
    "--chart-2": hexToHslChannels(event[3].value),
    "--chart-3": hexToHslChannels(event[1].value),
    "--chart-4": hexToHslChannels(event[0].value),
    "--chart-5": hexToHslChannels(event[6].value),
    "--sunnie-canvas": theme.core.canvas,
    "--sunnie-surface": theme.core.surface,
    "--sunnie-surface-raised": theme.core.surfaceRaised,
    "--sunnie-surface-muted": theme.core.surfaceMuted,
    "--sunnie-ink": theme.core.ink,
    "--sunnie-ink-soft": theme.core.inkSoft,
    "--sunnie-ink-muted": theme.core.inkMuted,
    "--sunnie-border": theme.core.border,
    "--sunnie-primary": theme.core.primary,
    "--sunnie-on-primary": theme.core.onPrimary,
    "--sunnie-accent": theme.core.accent,
    "--sunnie-on-accent": theme.core.onAccent,
    "--sunnie-warm-glow": theme.core.warmGlow,
    "--sunnie-cool-glow": theme.core.coolGlow,
  } satisfies Record<string, string>;
}
