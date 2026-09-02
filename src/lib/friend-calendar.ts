import { newDate } from "@/lib/date-utils";

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
  extendedProps: ExtendedEventProps;
};

export async function getFriendCalendarItems(start: Date, end: Date) {
  try {
    const response = await fetch(
      `/api/friends/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
      { cache: "no-store" }
    );
    if (!response.ok) return [];
    const blocks = (await response.json()) as FriendCalendarBlock[];

    return blocks.map(
      (block): FriendCalendarItem => ({
        id: `friend-${block.id}`,
        title: `${block.owner} · ${block.title}`,
        start: newDate(block.start),
        end: newDate(block.end),
        location: `Shared by ${block.owner}`,
        backgroundColor: block.color || "#8f78b7",
        borderColor: block.color || "#8f78b7",
        allDay: block.allDay,
        classNames: ["calendar-friend-event"],
        startEditable: false,
        durationEditable: false,
        extendedProps: {
          isFriendEvent: true,
          friendId: block.ownerId,
          friendOwner: block.owner,
          friendSource: block.source,
          calendarName: `${block.owner}'s shared time`,
        },
      })
    );
  } catch {
    // Friend overlays should never prevent the user's own calendar from loading.
    return [];
  }
}
