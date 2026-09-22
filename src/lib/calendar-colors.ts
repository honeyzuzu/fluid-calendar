import { getCalendarEventTitle } from "@/lib/calendar-event-title";
import {
  BASE_COLOR_THEME,
  ColorThemeId,
  resolveThemeLinkedColor,
} from "@/lib/color-themes";

import {
  CalendarEvent,
  CalendarFeed,
  ExtendedEventProps,
} from "@/types/calendar";

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

// FullCalendar items are cached separately from feeds. Reapply feed colors at
// render time so a sidebar change is visible before background refreshes end.
export function applyFeedColorsToCalendarItems<
  T extends {
    id: string;
    title?: string;
    backgroundColor: string;
    borderColor: string;
    extendedProps?: ExtendedEventProps;
  },
>(
  items: T[],
  feeds: CalendarFeed[],
  themeId: ColorThemeId,
  currentEvents: Array<
    Pick<CalendarEvent, "id" | "feedId" | "color" | "colorSlot"> &
      Partial<
        Pick<
          CalendarEvent,
          "title" | "titleOverride" | "externalEventId" | "isFree"
        >
      >
  >
): T[] {
  const currentEventsById = new Map(
    currentEvents.map((event) => [event.id, event])
  );
  return items.map((item) => {
    const source = item.extendedProps as
      | (ExtendedEventProps & Partial<CalendarEvent>)
      | undefined;
    if (!source?.feedId || source.isTask || source.isFriendEvent) return item;
    const currentEvent = currentEventsById.get(item.id);
    const color = getCalendarDisplayColor(
      {
        feedId: currentEvent?.feedId || source.feedId,
        color: currentEvent ? currentEvent.color : source.color,
        colorSlot: currentEvent ? currentEvent.colorSlot : source.colorSlot,
      },
      feeds,
      themeId
    );
    return {
      ...item,
      title: currentEvent?.title
        ? getCalendarEventTitle({
            title: currentEvent.title,
            titleOverride: currentEvent.titleOverride,
            externalEventId: currentEvent.externalEventId,
            isFree: currentEvent.isFree,
          })
        : item.title,
      backgroundColor: color,
      borderColor: color,
    };
  });
}
