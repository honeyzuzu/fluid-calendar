import { newDate } from "@/lib/date-utils";
import { getFriendCalendarColor } from "@/lib/friend-calendar-colors";

import { ExtendedEventProps } from "@/types/calendar";

export type FriendCalendarBlock = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  ownerId: string;
  owner: string;
  color: string;
  source: "calendar" | "focus";
};

export type FriendCalendarItem = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location: string;
  backgroundColor: string;
  borderColor: string;
  allDay: boolean;
  classNames: string[];
  startEditable: boolean;
  durationEditable: boolean;
  display: "background";
  extendedProps: ExtendedEventProps;
};

export async function getFriendCalendarItems(
  start: Date,
  end: Date,
  friendColors: Record<string, string> = {}
) {
  try {
    const response = await fetch(
      `/api/friends/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
      { cache: "no-store" }
    );
    if (!response.ok) return [];
    const blocks = (await response.json()) as FriendCalendarBlock[];
    const friendLanes = new Map(
      [...new Set(blocks.map((block) => block.ownerId))]
        .sort()
        .map((ownerId, index) => [ownerId, index] as const)
    );

    return blocks.map((block): FriendCalendarItem => {
      const friendColor = getFriendCalendarColor(block.ownerId, friendColors);
      const friendLane = Math.min(friendLanes.get(block.ownerId) ?? 0, 15);
      return {
        id: `friend-${block.id}`,
        title: "",
        start: newDate(block.start),
        end: newDate(block.end),
        location: "",
        backgroundColor: friendColor,
        borderColor: friendColor,
        allDay: block.allDay,
        display: "background",
        classNames: [
          "calendar-friend-event",
          `calendar-friend-lane-${friendLane}`,
        ],
        startEditable: false,
        durationEditable: false,
        extendedProps: {
          isFriendEvent: true,
          friendId: block.ownerId,
          friendOwner: block.owner,
          friendSource: block.source,
          friendLane,
          calendarName: `${block.owner}'s shared time`,
        },
      };
    });
  } catch {
    // Friend overlays should never prevent the user's own calendar from loading.
    return [];
  }
}
