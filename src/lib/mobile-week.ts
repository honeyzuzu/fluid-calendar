import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export interface MobileWeekDay {
  key: string;
  start: Date;
  end: Date;
}

export function getMobileWeekDays(
  currentDate: Date,
  timeZone: string,
  firstDay: "sunday" | "monday"
): MobileWeekDay[] {
  const currentKey = formatInTimeZone(currentDate, timeZone, "yyyy-MM-dd");
  const anchor = new Date(`${currentKey}T00:00:00.000Z`);
  const firstWeekday = firstDay === "monday" ? 1 : 0;
  anchor.setUTCDate(
    anchor.getUTCDate() - ((anchor.getUTCDay() - firstWeekday + 7) % 7)
  );

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(anchor);
    day.setUTCDate(anchor.getUTCDate() + index);
    const nextDay = new Date(day);
    nextDay.setUTCDate(day.getUTCDate() + 1);
    return {
      key: day.toISOString().slice(0, 10),
      start: fromZonedTime(
        `${day.toISOString().slice(0, 10)}T00:00:00`,
        timeZone
      ),
      end: fromZonedTime(
        `${nextDay.toISOString().slice(0, 10)}T00:00:00`,
        timeZone
      ),
    };
  });
}

export function itemsForMobileWeekDay<
  T extends { start: Date; end: Date; allDay: boolean },
>(items: T[], day: MobileWeekDay) {
  return items
    .filter((item) => {
      if (item.allDay) {
        // Provider all-day dates are date-only values, often stored at UTC
        // midnight. Comparing them as instants would shift them a day west of UTC.
        const startKey = item.start.toISOString().slice(0, 10);
        const endKey = item.end.toISOString().slice(0, 10);
        return (
          startKey <= day.key &&
          (endKey > day.key || (endKey === startKey && day.key === startKey))
        );
      }
      return item.start < day.end && item.end > day.start;
    })
    .sort(
      (first, second) =>
        Number(second.allDay) - Number(first.allDay) ||
        first.start.getTime() - second.start.getTime() ||
        first.end.getTime() - second.end.getTime()
    );
}

export interface MobileFriendBusyItem {
  start: Date;
  end: Date;
  allDay: boolean;
  backgroundColor: string;
  extendedProps?: {
    friendId?: string;
    friendOwner?: string;
  };
}

export function groupFriendBusyTime<T extends MobileFriendBusyItem>(
  items: T[],
  day: MobileWeekDay
) {
  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      color: string;
      windows: { start: Date; end: Date; allDay: boolean }[];
    }
  >();

  for (const item of items) {
    const id =
      item.extendedProps?.friendId ||
      item.extendedProps?.friendOwner ||
      "friend";
    const group = groups.get(id) || {
      id,
      name: item.extendedProps?.friendOwner || "Friend",
      color: item.backgroundColor,
      windows: [],
    };
    group.windows.push({
      start: item.allDay || item.start < day.start ? day.start : item.start,
      end: item.allDay || item.end > day.end ? day.end : item.end,
      allDay: item.allDay,
    });
    groups.set(id, group);
  }

  return [...groups.values()]
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((group) => {
      group.windows.sort(
        (first, second) => first.start.getTime() - second.start.getTime()
      );
      const merged: typeof group.windows = [];
      for (const window of group.windows) {
        const previous = merged.at(-1);
        if (previous && window.start <= previous.end) {
          if (window.end > previous.end) previous.end = window.end;
          previous.allDay ||= window.allDay;
        } else {
          merged.push({ ...window });
        }
      }
      return { ...group, windows: merged };
    });
}
