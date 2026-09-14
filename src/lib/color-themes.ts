import {
  getReadableTextColor,
  hasReadableContrast,
} from "@/lib/color-contrast";

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
export type ColorThemeId =
  | "base"
  | "autumn-golden-hour"
  | "spring-fresh-air"
  | "summer-sun-kissed"
  | "winter-candlelight-snow";
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

export const SPRING_FRESH_AIR_THEME: ColorTheme = {
  id: "spring-fresh-air",
  name: "Spring — Fresh Air",
  description:
    "Open windows, rainy mornings, tiny flowers, garden greens, and soft sunlight.",
  core: {
    canvas: "#F7F6EB",
    surface: "#FCFBF5",
    surfaceRaised: "#FFFDF8",
    surfaceMuted: "#E6EBDD",
    ink: "#3D4438",
    inkSoft: "#5D6858",
    inkMuted: "#7B8378",
    border: "#DCE1D3",
    primary: "#647A59",
    onPrimary: "#FBFAF3",
    accent: "#F0CF72",
    onAccent: "#5B5129",
    warmGlow: "#F1B77D",
    coolGlow: "#A9D2CE",
  },
  palettes: {
    events: [
      { id: "event-1", name: "Raincoat", value: "#E1B94F" },
      { id: "event-2", name: "Puddle Blue", value: "#719DB5" },
      { id: "event-3", name: "Rain Cloud", value: "#879AA1" },
      { id: "event-4", name: "Wet Clover", value: "#71906C" },
      { id: "event-5", name: "Lilac Rain", value: "#A89CC2" },
      { id: "event-6", name: "Tulip", value: "#D98287" },
      { id: "event-7", name: "Misty Mint", value: "#82B5A5" },
      { id: "event-8", name: "After the Rain", value: "#6592A0" },
    ],
    projects: [
      { id: "project-1", name: "Tea Rose", value: "#D8A3A5" },
      { id: "project-2", name: "Lavender Sprig", value: "#B5A6C5" },
      { id: "project-3", name: "Sweet Pea", value: "#E5B7C4" },
      { id: "project-4", name: "Garden Sage", value: "#9DAE8A" },
      { id: "project-5", name: "Chamomile", value: "#E5C875" },
      { id: "project-6", name: "Blue China", value: "#8FAFC0" },
    ],
    tasks: [
      { id: "task-1", name: "Cherry Blossom", value: "#E8BEC2" },
      { id: "task-2", name: "Daffodil", value: "#ECD58D" },
      { id: "task-3", name: "New Leaf", value: "#B8CBA6" },
      { id: "task-4", name: "Crocus", value: "#C7B8D5" },
      { id: "task-5", name: "Forget-Me-Not", value: "#AFC9D7" },
      { id: "task-6", name: "Peach Blossom", value: "#EDC2A8" },
    ],
    friends: [
      { id: "friend-1", name: "Strawberry Jam", value: "#CE7E7E" },
      { id: "friend-2", name: "Lemonade", value: "#E4C86F" },
      { id: "friend-3", name: "Picnic Grass", value: "#91A878" },
      { id: "friend-4", name: "Gingham Blue", value: "#8DAEC1" },
      { id: "friend-5", name: "Wicker Basket", value: "#C5A47D" },
      { id: "friend-6", name: "Wildflower", value: "#B395B5" },
    ],
    statuses: [
      { id: "success", name: "Garden Green", value: "#63845D" },
      { id: "warning", name: "Marigold", value: "#C99636" },
      { id: "danger", name: "Poppy", value: "#BE6867" },
      { id: "info", name: "Rain Blue", value: "#648CA5" },
    ],
  },
};

export const SUMMER_SUN_KISSED_THEME: ColorTheme = {
  id: "summer-sun-kissed",
  name: "Summer — Sun-Kissed",
  description:
    "Long sunny days filled with fruit stands, salty air, flowers, and cold drinks.",
  core: {
    canvas: "#FBF5E7",
    surface: "#FFF9EE",
    surfaceRaised: "#FFFCF5",
    surfaceMuted: "#E7E8D4",
    ink: "#41453A",
    inkSoft: "#626B56",
    inkMuted: "#7F8170",
    border: "#E2D9C2",
    primary: "#56877F",
    onPrimary: "#FFF9EE",
    accent: "#F2C85E",
    onAccent: "#5B4C20",
    warmGlow: "#F2A36F",
    coolGlow: "#8FCAC8",
  },
  palettes: {
    events: [
      { id: "event-1", name: "Strawberry", value: "#D94F45" },
      { id: "event-2", name: "Strawberry Milk", value: "#E7A4A5" },
      { id: "event-3", name: "Buttercup", value: "#E9B94F" },
      { id: "event-4", name: "Leaf Hat", value: "#6F925F" },
      { id: "event-5", name: "Berry Basket", value: "#B88663" },
      { id: "event-6", name: "Blue Sky", value: "#75A8BC" },
      { id: "event-7", name: "Wildflower", value: "#A58AB3" },
      { id: "event-8", name: "Fresh Mint", value: "#72A68C" },
    ],
    projects: [
      { id: "project-1", name: "Tomato", value: "#C95043" },
      { id: "project-2", name: "Basil", value: "#71885B" },
      { id: "project-3", name: "Fresh Bread", value: "#D7AE78" },
      { id: "project-4", name: "Pottery", value: "#C9784D" },
      { id: "project-5", name: "Green Apple", value: "#91A75E" },
      { id: "project-6", name: "Market Blue", value: "#6E91A2" },
    ],
    tasks: [
      { id: "task-1", name: "Seafoam", value: "#A9D4C8" },
      { id: "task-2", name: "Ocean Milk", value: "#B9D6DF" },
      { id: "task-3", name: "Seashell Pink", value: "#E9BDB5" },
      { id: "task-4", name: "Beach Towel", value: "#A8AFD0" },
      { id: "task-5", name: "Lemon Ice", value: "#EAD88D" },
      { id: "task-6", name: "Warm Sand", value: "#DDC6A5" },
    ],
    friends: [
      { id: "friend-1", name: "Tea Rose", value: "#D79FA1" },
      { id: "friend-2", name: "Morning Mist", value: "#8FA8A0" },
      { id: "friend-3", name: "Lily Pad", value: "#587A70" },
      { id: "friend-4", name: "Canyon Sunset", value: "#D98767" },
      { id: "friend-5", name: "Sunflower", value: "#D9AF58" },
      { id: "friend-6", name: "Hydrangea", value: "#899EBE" },
    ],
    statuses: [
      { id: "success", name: "Basil Green", value: "#60845E" },
      { id: "warning", name: "Golden Sun", value: "#D39B32" },
      { id: "danger", name: "Tomato Red", value: "#C45C50" },
      { id: "info", name: "Ocean Blue", value: "#5F91A8" },
    ],
  },
};

export const WINTER_CANDLELIGHT_SNOW_THEME: ColorTheme = {
  id: "winter-candlelight-snow",
  name: "Winter — Candlelight & Snow",
  description:
    "Fresh snowfall and evergreen branches followed by rosy twilight and hot drinks.",
  core: {
    canvas: "#F5F3EC",
    surface: "#FBFAF6",
    surfaceRaised: "#FFFEFA",
    surfaceMuted: "#E2E5DF",
    ink: "#343E39",
    inkSoft: "#56615C",
    inkMuted: "#777F7C",
    border: "#D7DBD7",
    primary: "#4F6659",
    onPrimary: "#FBFAF6",
    accent: "#D9A5A2",
    onAccent: "#613F42",
    warmGlow: "#E6B66C",
    coolGlow: "#A9C6CF",
  },
  palettes: {
    events: [
      { id: "event-1", name: "Snowy Sky", value: "#91B4C4" },
      { id: "event-2", name: "Blue Shadow", value: "#718CA4" },
      { id: "event-3", name: "Snow Lavender", value: "#A9A4BE" },
      { id: "event-4", name: "Evergreen", value: "#557264" },
      { id: "event-5", name: "Rosy Cheeks", value: "#C98282" },
      { id: "event-6", name: "Winterberry", value: "#A45E67" },
      { id: "event-7", name: "Wool Scarf", value: "#B88C70" },
      { id: "event-8", name: "Golden Window", value: "#D5AE68" },
    ],
    projects: [
      { id: "project-1", name: "Gingerbread", value: "#B77D59" },
      { id: "project-2", name: "Cinnamon", value: "#A96455" },
      { id: "project-3", name: "Vanilla Icing", value: "#DED0B5" },
      { id: "project-4", name: "Peppermint", value: "#C57878" },
      { id: "project-5", name: "Sugared Sage", value: "#8FA58D" },
      { id: "project-6", name: "Sugar Plum", value: "#96788F" },
    ],
    tasks: [
      { id: "task-1", name: "Ballet Slipper", value: "#E1BCC0" },
      { id: "task-2", name: "Sugar Plum", value: "#C5A7C0" },
      { id: "task-3", name: "Frosted Lilac", value: "#B9B6D0" },
      { id: "task-4", name: "Peppermint Cream", value: "#E2B5B1" },
      { id: "task-5", name: "Winter Mint", value: "#B4CDC3" },
      { id: "task-6", name: "Champagne Snow", value: "#E4D5B5" },
    ],
    friends: [
      { id: "friend-1", name: "Cocoa", value: "#9A7968" },
      { id: "friend-2", name: "Marshmallow", value: "#D8CABB" },
      { id: "friend-3", name: "Cranberry Jam", value: "#A96C70" },
      { id: "friend-4", name: "Knit Sweater", value: "#87979A" },
      { id: "friend-5", name: "Pistachio Biscotti", value: "#9DA486" },
      { id: "friend-6", name: "Honey Mug", value: "#C69A62" },
    ],
    statuses: [
      { id: "success", name: "Evergreen", value: "#587862" },
      { id: "warning", name: "Candle Gold", value: "#C5913E" },
      { id: "danger", name: "Cranberry", value: "#AF5F64" },
      { id: "info", name: "Winter Blue", value: "#6388A0" },
    ],
  },
};

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  base: BASE_COLOR_THEME,
  "autumn-golden-hour": AUTUMN_GOLDEN_HOUR_THEME,
  "spring-fresh-air": SPRING_FRESH_AIR_THEME,
  "summer-sun-kissed": SUMMER_SUN_KISSED_THEME,
  "winter-candlelight-snow": WINTER_CANDLELIGHT_SNOW_THEME,
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
  const primaryForeground = hasReadableContrast(
    theme.core.onPrimary,
    theme.core.primary
  )
    ? theme.core.onPrimary
    : getReadableTextColor(theme.core.primary);
  const accentForeground = hasReadableContrast(
    theme.core.onAccent,
    theme.core.accent
  )
    ? theme.core.onAccent
    : getReadableTextColor(theme.core.accent);

  return {
    "--background": hexToHslChannels(theme.core.canvas),
    "--foreground": hexToHslChannels(theme.core.ink),
    "--card": hexToHslChannels(theme.core.surface),
    "--card-foreground": hexToHslChannels(theme.core.ink),
    "--popover": hexToHslChannels(theme.core.surfaceRaised),
    "--popover-foreground": hexToHslChannels(theme.core.ink),
    "--primary": hexToHslChannels(theme.core.primary),
    "--primary-foreground": hexToHslChannels(primaryForeground),
    "--secondary": hexToHslChannels(theme.core.surfaceMuted),
    "--secondary-foreground": hexToHslChannels(theme.core.inkSoft),
    "--muted": hexToHslChannels(theme.core.surfaceMuted),
    // Small muted labels require normal-text contrast. inkMuted remains
    // available for larger/decorative uses through --sunnie-ink-muted.
    "--muted-foreground": hexToHslChannels(theme.core.inkSoft),
    "--accent": hexToHslChannels(theme.core.accent),
    "--accent-foreground": hexToHslChannels(accentForeground),
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
