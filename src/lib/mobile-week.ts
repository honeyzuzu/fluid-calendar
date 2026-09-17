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
