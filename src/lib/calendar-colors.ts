import {
  BASE_COLOR_THEME,
  ColorThemeId,
  resolveThemeLinkedColor,
} from "@/lib/color-themes";

import { CalendarEvent, CalendarFeed } from "@/types/calendar";

export interface SunnieEventColor {
  name: string;
  value: string;
}

export interface SunnieEventColorGroup {
  name: string;
  colors: readonly SunnieEventColor[];
}

export const SUNNIE_EVENT_COLOR_GROUPS: readonly SunnieEventColorGroup[] = [
  {
    name: "Sky & water",
    colors: BASE_COLOR_THEME.palettes.events.slice(0, 4),
  },
  {
    name: "Garden & sunset",
    colors: BASE_COLOR_THEME.palettes.events.slice(4, 8),
  },
] as const;

export const SUNNIE_PASTEL_COLORS: readonly SunnieEventColor[] =
  SUNNIE_EVENT_COLOR_GROUPS.flatMap((group) => group.colors);

export function getCalendarDisplayColor(
  event: Pick<CalendarEvent, "feedId" | "color" | "colorSlot">,
  feeds: CalendarFeed[],
  themeId: ColorThemeId
) {
  if (event.colorSlot || event.color) {
    return resolveThemeLinkedColor(
      "events",
      event.colorSlot,
      event.color,
      themeId
    );
  }
  const feed = feeds.find((candidate) => candidate.id === event.feedId);
  return resolveThemeLinkedColor(
    "events",
    feed?.colorSlot,
    feed?.color,
    themeId
  );
}
