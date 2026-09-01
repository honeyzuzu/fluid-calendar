import { memo } from "react";

import type { EventContentArg } from "@fullcalendar/core";
import { IoCheckmarkCircle, IoRepeat, IoTimeOutline } from "react-icons/io5";

import { getMonthEventDisplay } from "@/lib/calendar-event-display";
import { isTaskOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/store/settings";

import { TaskStatus } from "@/types/task";

const DEFAULT_EVENT_COLOR = "#3b82f6";

interface CalendarEventContentProps {
  eventInfo: EventContentArg;
}

export const CalendarEventContent = memo(function CalendarEventContent({
  eventInfo,
}: CalendarEventContentProps) {
  const { user: userSettings } = useSettingsStore();
  const isTask = eventInfo.event.extendedProps.isTask;
  const isRecurring = eventInfo.event.extendedProps.isRecurring;
  const status = eventInfo.event.extendedProps.status;
  const priority = eventInfo.event.extendedProps.priority;
  const location = eventInfo.event.extendedProps.location;
  const calendarName = eventInfo.event.extendedProps.calendarName;
  const dueDate = eventInfo.event.extendedProps?.extendedProps?.dueDate;
  const title = eventInfo.event.title;
  const endTime = eventInfo.event.end?.getTime() ?? 0;
  const startTime = eventInfo.event.start?.getTime() ?? 0;
  const duration = endTime - startTime;
  const isCompactTimedTask =
    !!isTask &&
    eventInfo.view.type.startsWith("timeGrid") &&
    duration > 0 &&
    duration <= 30 * 60 * 1000;

  const isOverdue = isTask && isTaskOverdue({ dueDate, status });

  // Issue #95: surface the start time and calendar color for timed events in
  // month/multi-month views so they read as clearly as the colored all-day
  // events. Time-grid (day/week) views are unaffected.
  // Format the chip in the same time zone FullCalendar renders with (its
  // `local` sentinel today) so the chip time always matches the calendar's own
  // display, even if the browser's local zone differs from the configured one.
  const calendarTimeZone =
    (eventInfo.view.calendar.getOption("timeZone") as string | undefined) ??
    "local";
  const { isDayGridTimed, showTimeChip, timeText } = getMonthEventDisplay({
    viewType: eventInfo.view.type,
    allDay: eventInfo.event.allDay,
    isTask: !!isTask,
    start: eventInfo.event.start,
    isStart: eventInfo.isStart,
    timeFormat: userSettings.timeFormat,
    timeZone: calendarTimeZone,
  });
  const eventColor =
    eventInfo.event.backgroundColor ||
    eventInfo.event.borderColor ||
    DEFAULT_EVENT_COLOR;

  return (
    <div
      data-testid={isTask ? "calendar-task" : "calendar-event"}
      data-priority={priority || "none"}
      className={cn(
        "flex h-full flex-col justify-start gap-1 overflow-hidden text-[11px]",
        isTask && "text-[#4d513d]",
        isCompactTimedTask && "justify-center gap-0",
        isOverdue && "font-medium text-[#8c4039]",
        status === TaskStatus.COMPLETED && "text-gray-500 line-through"
      )}
    >
      <div className="flex w-full items-center gap-1.5">
        {isTask ? (
          !isCompactTimedTask && (
            <IoCheckmarkCircle className="h-3.5 w-3.5 flex-shrink-0 text-current opacity-70" />
          )
        ) : showTimeChip ? (
          isRecurring ? (
            <IoRepeat
              className="h-3.5 w-3.5 flex-shrink-0"
              style={{ color: eventColor }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: eventColor }}
            />
          )
        ) : isRecurring ? (
          <IoRepeat className="h-3.5 w-3.5 flex-shrink-0 text-current opacity-75" />
        ) : (
          <IoTimeOutline className="h-3.5 w-3.5 flex-shrink-0 text-current opacity-75" />
        )}
        <div className="min-w-0 flex-1">
          <div
            title={title}
            className={cn(
              "calendar-event-title font-medium leading-snug",
              isCompactTimedTask
                ? "truncate leading-none"
                : duration <= 1800000
                  ? "truncate"
                  : "line-clamp-2 break-words"
            )}
          >
            {isDayGridTimed && calendarName && (
              <span className="sr-only">{calendarName}, </span>
            )}
            {showTimeChip && timeText && (
              <span className="mr-1 font-normal tabular-nums opacity-75">
                {timeText}
              </span>
            )}
            {title}
          </div>
        </div>
      </div>
      {location && duration > 1800000 && (
        <div className="event-location truncate pl-5 text-[10px] leading-snug opacity-80">
          {location}
        </div>
      )}
    </div>
  );
});
