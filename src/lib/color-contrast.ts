const LIGHT_TEXT = "#FFFDF7";
const DARK_TEXT = "#313526";

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

/**
 * Sunnie prefers warm white text on color. For light colors where that would
 * fail WCAG AA normal-text contrast, it switches to the app's soft black.
 */
export function getReadableTextColor(backgroundColor?: string | null) {
  if (!backgroundColor) return DARK_TEXT;
  const background = relativeLuminance(backgroundColor);
  const light = relativeLuminance(LIGHT_TEXT);
  if (background === null || light === null) return DARK_TEXT;

  return contrastRatio(background, light) >= 4.5 ? LIGHT_TEXT : DARK_TEXT;
}
