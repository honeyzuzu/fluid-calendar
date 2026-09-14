const LIGHT_TEXT = "#FFFDF7";
const DARK_TEXT = "#313526";
const DEEP_DARK_TEXT = "#171812";
const BLACK_TEXT = "#000000";

function parseHexColor(color: string) {
  const normalized = color.trim().replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character + character)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  return [0, 2, 4].map((offset) =>
    Number.parseInt(expanded.slice(offset, offset + 2), 16)
  );
}

function toHexColor(channels: number[]) {
  return `#${channels
    .map((channel) =>
      Math.round(channel).toString(16).padStart(2, "0").toUpperCase()
    )
    .join("")}`;
}

function mixHexColors(first: string, second: string, secondWeight: number) {
  const firstRgb = parseHexColor(first);
  const secondRgb = parseHexColor(second);
  if (!firstRgb || !secondRgb) return null;

  const weight = Math.min(1, Math.max(0, secondWeight));
  return toHexColor(
    firstRgb.map(
      (channel, index) => channel * (1 - weight) + secondRgb[index] * weight
    )
  );
}

function relativeLuminance(color: string) {
  const rgb = parseHexColor(color);
  if (!rgb) return null;

  const channels = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: number, second: number) {
  const lightest = Math.max(first, second);
  const darkest = Math.min(first, second);
  return (lightest + 0.05) / (darkest + 0.05);
}

export function hasReadableContrast(
  foregroundColor: string,
  backgroundColor: string,
  minimumRatio = 4.5
) {
  const foreground = relativeLuminance(foregroundColor);
  const background = relativeLuminance(backgroundColor);
  if (foreground === null || background === null) return false;
  return contrastRatio(foreground, background) >= minimumRatio;
}

/**
 * Sunnie prefers warm white text on color. For light colors where that would
 * fail WCAG AA normal-text contrast, it switches to the app's soft black. A
 * narrow band of middle-luminance colors needs true black to remain readable.
 */
export function getReadableTextColor(backgroundColor?: string | null) {
  if (!backgroundColor) return DARK_TEXT;
  const background = relativeLuminance(backgroundColor);
  const light = relativeLuminance(LIGHT_TEXT);
  if (background === null || light === null) return DARK_TEXT;

  if (contrastRatio(background, light) >= 4.5) return LIGHT_TEXT;

  const dark = relativeLuminance(DARK_TEXT)!;
  if (contrastRatio(background, dark) >= 4.5) return DARK_TEXT;

  const black = relativeLuminance(BLACK_TEXT)!;
  return contrastRatio(background, black) >= contrastRatio(background, light)
    ? BLACK_TEXT
    : LIGHT_TEXT;
}

type HarmonizedTextColorOptions = {
  /** The active theme's ink color. */
  darkColor?: string;
  /** The active theme's cream or raised-paper color. */
  lightColor?: string;
  /** A palette swatch to preserve while moving toward ink or cream. */
  tintColor?: string;
  minimumRatio?: number;
};

/**
 * Produces accessible text that remains visually related to its item swatch.
 * The swatch is progressively mixed toward the active theme's ink or cream;
 * the first WCAG-safe tint wins. Generic warm black/white remain final
 * fallbacks for malformed custom colors or an unusually low-contrast theme.
 */
export function getHarmonizedTextColor(
  backgroundColor?: string | null,
  options: HarmonizedTextColorOptions = {}
) {
  if (!backgroundColor || !parseHexColor(backgroundColor)) {
    return getReadableTextColor(backgroundColor);
  }

  const minimumRatio = options.minimumRatio ?? 4.5;
  const tintColor = options.tintColor ?? backgroundColor;
  const darkColor = parseHexColor(options.darkColor ?? "")
    ? options.darkColor!
    : DARK_TEXT;
  const lightColor = parseHexColor(options.lightColor ?? "")
    ? options.lightColor!
    : LIGHT_TEXT;
  const background = relativeLuminance(backgroundColor)!;
  const dark = relativeLuminance(darkColor)!;
  const light = relativeLuminance(lightColor)!;
  const preferredTarget =
    contrastRatio(background, dark) >= contrastRatio(background, light)
      ? darkColor
      : lightColor;
  const alternateTarget =
    preferredTarget === darkColor ? lightColor : darkColor;

  const fallbackTargets = [
    preferredTarget,
    alternateTarget,
    DARK_TEXT,
    LIGHT_TEXT,
    DEEP_DARK_TEXT,
    BLACK_TEXT,
  ].filter((target, index, targets) => targets.indexOf(target) === index);

  for (const target of fallbackTargets) {
    for (const weight of [0.55, 0.65, 0.75, 0.85, 0.95, 1]) {
      const candidate = mixHexColors(tintColor, target, weight);
      if (
        candidate &&
        hasReadableContrast(candidate, backgroundColor, minimumRatio)
      ) {
        return candidate;
      }
    }
  }

  return getReadableTextColor(backgroundColor);
}
