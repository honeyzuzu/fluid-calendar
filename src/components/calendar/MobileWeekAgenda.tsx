"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatInTimeZone } from "date-fns-tz";

import { type MobileWeekDay, itemsForMobileWeekDay } from "@/lib/mobile-week";
import { cn } from "@/lib/utils";

export interface MobileWeekItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  backgroundColor: string;
  extendedProps?: {
    isTask?: boolean;
    isFriendEvent?: boolean;
  };
}

interface MobileWeekAgendaProps {
  days: MobileWeekDay[];
  items: MobileWeekItem[];
  selectedDate: Date;
  timeZone: string;
  timeFormat: "12h" | "24h";
  onOpenDay: (date: Date) => void;
  onOpenItem: (item: MobileWeekItem, element: HTMLElement) => void;
}

export function MobileWeekAgenda({
  days,
  items,
  selectedDate,
  timeZone,
  timeFormat,
  onOpenDay,
  onOpenItem,
}: MobileWeekAgendaProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const manuallyNavigatedRef = useRef(false);
  const selectedDateKey = formatInTimeZone(
    selectedDate,
    timeZone,
    "yyyy-MM-dd"
  );
  const [focusedDay, setFocusedDay] = useState(selectedDateKey);
  useEffect(() => setFocusedDay(selectedDateKey), [selectedDateKey]);
  const todayKey = formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: timeFormat === "12h" ? "numeric" : "2-digit",
        minute: "2-digit",
        hour12: timeFormat === "12h",
        timeZone,
      }),
    [timeFormat, timeZone]
  );
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    []
  );
  const shortDayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        timeZone: "UTC",
      }),
    []
  );

  const dayItems = useMemo(
    () => days.map((day) => itemsForMobileWeekDay(items, day)),
    [days, items]
  );
  const firstWeekKey = days[0]?.key;

  useEffect(() => {
    manuallyNavigatedRef.current = false;
  }, [firstWeekKey]);

  useEffect(() => {
    if (manuallyNavigatedRef.current) return;
    const scroller = scrollerRef.current;
    const section = sectionsRef.current[selectedDateKey];
    if (scroller && section) {
      scroller.scrollTo({ top: section.offsetTop - scroller.offsetTop - 72 });
    }
  }, [dayItems, selectedDateKey]);

  const focusDay = (day: MobileWeekDay) => {
    manuallyNavigatedRef.current = true;
    setFocusedDay(day.key);
    const scroller = scrollerRef.current;
    const section = sectionsRef.current[day.key];
    if (scroller && section) {
      scroller.scrollTo({ top: section.offsetTop - scroller.offsetTop - 72 });
    }
  };

  return (
    <div
      ref={scrollerRef}
      onTouchStart={() => {
        manuallyNavigatedRef.current = true;
      }}
      onWheel={() => {
        manuallyNavigatedRef.current = true;
      }}
      className="h-full overflow-y-auto overscroll-contain bg-background"
    >
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-2 py-2 backdrop-blur-md">
        <div className="grid grid-cols-7 gap-1" aria-label="Days this week">
          {days.map((day, index) => {
            const date = new Date(`${day.key}T12:00:00.000Z`);
            return (
              <button
                key={day.key}
                type="button"
                aria-label={`Show ${dayFormatter.format(date)}`}
                aria-pressed={focusedDay === day.key}
                onClick={() => focusDay(day)}
                className={cn(
                  "flex min-w-0 flex-col items-center rounded-xl px-0.5 py-1.5 text-center transition-colors",
                  focusedDay === day.key
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="text-[11px] font-medium uppercase leading-4">
                  {shortDayFormatter.format(date)}
                </span>
                <span className="text-base font-semibold leading-5">
                  {date.getUTCDate()}
                </span>
                <span
                  className={cn(
                    "mt-1 h-1.5 w-1.5 rounded-full",
                    dayItems[index].length
                      ? focusedDay === day.key
                        ? "bg-primary-foreground"
                        : "bg-primary"
                      : "bg-transparent"
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 px-3 pb-[55vh] pt-2">
        {days.map((day, index) => {
          const date = new Date(`${day.key}T12:00:00.000Z`);
          const entries = dayItems[index];
          return (
            <section
              key={day.key}
              ref={(element) => {
                sectionsRef.current[day.key] = element;
              }}
              className="scroll-mt-24 border-b border-border/70 py-3 last:border-0"
              aria-label={dayFormatter.format(date)}
            >
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDay(day.start)}
                  className="min-w-0 text-left text-base font-semibold text-foreground hover:text-primary"
                  aria-label={`Open day view for ${dayFormatter.format(date)}`}
                >
                  {dayFormatter.format(date)}
                </button>
                {day.key === todayKey && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Today
                  </span>
                )}
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {entries.length ? `${entries.length} planned` : "Open day"}
                </span>
              </div>

              {entries.length ? (
                <div className="space-y-2">
                  {entries.map((item) => {
                    const label = item.allDay
                      ? "All day"
                      : item.start < day.start
                        ? `Continues until ${timeFormatter.format(item.end)}`
                        : `${timeFormatter.format(item.start)}–${timeFormatter.format(item.end)}`;
                    const isFriend = item.extendedProps?.isFriendEvent;
                    const content = (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-muted-foreground">
                            {label}
                          </span>
                          <span className="mt-0.5 block break-words text-sm font-semibold leading-5 text-foreground">
                            {item.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                          {isFriend
                            ? "Friend"
                            : item.extendedProps?.isTask
                              ? "Task"
                              : "Event"}
                        </span>
                      </>
                    );
                    const classes =
                      "flex w-full items-start gap-2 rounded-xl border border-border/80 border-l-4 bg-card px-3 py-2.5 text-left shadow-sm";
                    return isFriend ? (
                      <div
                        key={`${day.key}-${item.id}`}
                        className={classes}
                        style={{ borderLeftColor: item.backgroundColor }}
                      >
                        {content}
                      </div>
                    ) : (
                      <button
                        key={`${day.key}-${item.id}`}
                        type="button"
                        className={cn(
                          classes,
                          "hover:bg-muted/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        )}
                        style={{ borderLeftColor: item.backgroundColor }}
                        onClick={(event) =>
                          onOpenItem(item, event.currentTarget)
                        }
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  Nothing planned yet
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
