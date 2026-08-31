export const MAX_RECENT_COLORS = 7;

export function addRecentColor(
  colors: string[],
  color: string,
  excludedColors: readonly string[] = []
): string[] {
  const normalizedColor = color.toUpperCase();
  const excluded = new Set(excludedColors.map((item) => item.toUpperCase()));

  if (!/^#[0-9A-F]{6}$/.test(normalizedColor) || excluded.has(normalizedColor)) {
    return colors;
  }

  return [
    normalizedColor,
    ...colors.filter((item) => item.toUpperCase() !== normalizedColor),
  ].slice(0, MAX_RECENT_COLORS);
}
