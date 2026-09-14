import { BASE_COLOR_THEME } from "@/lib/color-themes";

export const DEFAULT_FRIEND_CALENDAR_COLOR =
  BASE_COLOR_THEME.palettes.friends[0].value;

export const FRIEND_CALENDAR_COLORS = BASE_COLOR_THEME.palettes.friends;

export function getFriendCalendarColor(
  friendId: string,
  colors: Record<string, string>,
  fallbackColor = DEFAULT_FRIEND_CALENDAR_COLOR
) {
  return colors[friendId] || fallbackColor;
}
