import { formatInTimeZone } from "date-fns-tz";

import { CalendarView } from "@/types/calendar";

export type CalendarNavigationUnit =
  | "Day"
  | "Week"
  | "Month"
  | "Year"
  | "Period";

export function getCalendarNavigationUnit(
  view: CalendarView
): CalendarNavigationUnit {
  switch (view) {
    case "day":
      return "Day";
    case "week":
      return "Week";
    case "month":
      return "Month";
    case "multiMonth":
      return "Year";
    case "agenda":
      return "Period";
  }
}

export function getCalendarHeading(
  view: CalendarView,
  date: Date,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  weekStartDay: "sunday" | "monday" = "sunday"
): string {
  const dayKey = formatInTimeZone(date, timeZone, "yyyy-MM-dd");
  const [year, month, day] = dayKey.split("-").map(Number);
  const calendarDay = new Date(Date.UTC(year, month - 1, day, 12));
  const dateLabel = (value: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(
      value
    );
  switch (view) {
    case "month":
      return dateLabel(calendarDay, { month: "long", year: "numeric" });
    case "multiMonth":
      return String(year);
    case "week": {
      const first = new Date(calendarDay);
      const offset =
        (calendarDay.getUTCDay() - (weekStartDay === "monday" ? 1 : 0) + 7) %
        7;
      first.setUTCDate(first.getUTCDate() - offset);
      const last = new Date(first);
      last.setUTCDate(last.getUTCDate() + 6);
      const crossesYear = first.getUTCFullYear() !== last.getUTCFullYear();
      const sameMonth =
        !crossesYear && first.getUTCMonth() === last.getUTCMonth();
      const firstLabel = dateLabel(first, {
        month: "short",
        day: "numeric",
        ...(crossesYear ? { year: "numeric" } : {}),
      });
      const lastLabel = dateLabel(
        last,
        sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" }
      );
      return `${firstLabel}–${lastLabel}, ${last.getUTCFullYear()}`;
    }
    default:
      return dateLabel(calendarDay, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
  }
}
