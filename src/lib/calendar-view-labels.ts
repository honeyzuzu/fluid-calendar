import { format, formatDate } from "@/lib/date-utils";

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

export function getCalendarHeading(view: CalendarView, date: Date): string {
  switch (view) {
    case "month":
      return format(date, "MMMM yyyy");
    case "multiMonth":
      return format(date, "yyyy");
    default:
      return formatDate(date);
  }
}
