"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatInTimeZone } from "date-fns-tz";
import { ChevronDown } from "lucide-react";

import {
  type MobileWeekDay,
  groupFriendBusyTime,
  itemsForMobileWeekDay,
} from "@/lib/mobile-week";
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
    friendId?: string;
    friendOwner?: string;
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
  const [expandedFriendDays, setExpandedFriendDays] = useState<
    Record<string, boolean>
  >({});
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
          const personalEntries = entries.filter(
            (item) => !item.extendedProps?.isFriendEvent
          );
          const friendEntries = entries.filter(
            (item) => item.extendedProps?.isFriendEvent
          );
          const friendGroups = groupFriendBusyTime(friendEntries, day);
          const friendsExpanded = !!expandedFriendDays[day.key];
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
                  {personalEntries.length
                    ? `${personalEntries.length} planned`
                    : "Open day"}
                </span>
              </div>

              {personalEntries.length ? (
                <div className="space-y-2">
                  {personalEntries.map((item) => {
                    const label = item.allDay
                      ? "All day"
                      : item.start < day.start
                        ? `Continues until ${timeFormatter.format(item.end)}`
                        : `${timeFormatter.format(item.start)}–${timeFormatter.format(item.end)}`;
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
                          {item.extendedProps?.isTask ? "Task" : "Event"}
                        </span>
                      </>
                    );
                    const classes =
                      "flex w-full items-start gap-2 rounded-xl border border-border/80 border-l-4 bg-card px-3 py-2.5 text-left shadow-sm";
                    return (
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
              ) : friendGroups.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  Nothing planned yet
                </p>
              ) : null}
              {friendGroups.length > 0 && (
                <div className="mt-2 rounded-xl border border-border/80 bg-muted/35">
                  <button
                    type="button"
                    aria-expanded={friendsExpanded}
                    aria-controls={`friends-busy-${day.key}`}
                    onClick={() =>
                      setExpandedFriendDays((current) => ({
                        ...current,
                        [day.key]: !current[day.key],
                      }))
                    }
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-muted/65"
                  >
                    <span
                      className="flex shrink-0 -space-x-1"
                      aria-hidden="true"
                    >
                      {friendGroups.slice(0, 4).map((friend) => (
                        <span
                          key={friend.id}
                          className="h-4 w-4 rounded-full border-2 border-card"
                          style={{ backgroundColor: friend.color }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {friendGroups.length === 1
                        ? `${friendGroups[0].name} is busy`
                        : `${friendGroups.length} friends are busy`}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {friendEntries.length}{" "}
                      {friendEntries.length === 1 ? "block" : "blocks"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        friendsExpanded && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {friendsExpanded && (
                    <div
                      id={`friends-busy-${day.key}`}
                      className="space-y-2 border-t border-border/70 px-3 py-3"
                    >
                      {friendGroups.map((friend) => (
                        <div key={friend.id} className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: friend.color }}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 break-words">
                              {friend.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 pl-[18px] text-xs text-muted-foreground">
                            {friend.windows.map((window) => (
                              <span
                                key={`${window.start.toISOString()}-${window.end.toISOString()}`}
                                className="whitespace-nowrap rounded-md bg-background px-1.5 py-1"
                              >
                                {window.allDay
                                  ? "All day"
                                  : `${timeFormatter.format(window.start)}–${timeFormatter.format(window.end)}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
