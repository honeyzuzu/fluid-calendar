"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { DayView } from "@/components/calendar/DayView";
import { FeedManager } from "@/components/calendar/FeedManager";
import { MonthView } from "@/components/calendar/MonthView";
import { MultiMonthView } from "@/components/calendar/MultiMonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { AutoScheduleTooltip } from "@/components/tasks/AutoScheduleTooltip";
import { SponsorshipBanner } from "@/components/ui/sponsorship-banner";

import { useEventModalStore } from "@/lib/commands/groups/calendar";
import { isSaasEnabled } from "@/lib/config";
import { addDays, formatDate, newDate, subDays } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

import { useAutoSchedule } from "@/hooks/use-auto-schedule";

import {
  useCalendarStore,
  useCalendarUIStore,
  useViewStore,
} from "@/store/calendar";
import { useTaskStore } from "@/store/task";

import { CalendarEvent, CalendarFeed } from "@/types/calendar";

// Dynamically import the appropriate version of the LifetimeAccessBanner
const LifetimeAccessBanner = dynamic(
  () =>
    import(`./LifetimeAccessBanner.${isSaasEnabled ? "saas" : "open"}`).then(
      (mod) => mod.LifetimeAccessBanner
    ),
  { ssr: false } // Disable SSR for this component to prevent import errors
);

interface CalendarProps {
  initialFeeds?: CalendarFeed[];
  initialEvents?: CalendarEvent[];
}

export function Calendar({
  initialFeeds = [],
  initialEvents = [],
}: CalendarProps) {
  const { date: currentDate, setDate, view, setView } = useViewStore();
  const {
    isSidebarOpen,
    setSidebarOpen,
    isHydrated,
    requestFriendCalendarRefresh,
  } = useCalendarUIStore();
  const { feeds, setFeeds, setEvents, syncAllFeeds } = useCalendarStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const refreshInFlight = useRef(false);
  const lastRefreshedAtRef = useRef<Date | null>(null);
  const handleAutoSchedule = useAutoSchedule();
  const eventModalStore = useEventModalStore();

  // Use initial data from server for hydration
  useEffect(() => {
    if (initialFeeds.length > 0) {
      setFeeds(initialFeeds);
    }

    if (initialEvents.length > 0) {
      setEvents(initialEvents);
    }

    // Only fetch from database if we didn't get initial data
    if (!initialFeeds.length || !initialEvents.length) {
      useCalendarStore.getState().loadFromDatabase();
    }

    // Always fetch tasks since they're not pre-loaded
    useTaskStore.getState().fetchTasks();
  }, [initialFeeds, initialEvents, setFeeds, setEvents]);

  const latestFeedSync = useMemo(() => {
    const timestamps = feeds
      .map((feed) => (feed.lastSync ? newDate(feed.lastSync).getTime() : 0))
      .filter(Boolean);
    return timestamps.length ? new Date(Math.max(...timestamps)) : null;
  }, [feeds]);

  useEffect(() => {
    if (latestFeedSync) {
      lastRefreshedAtRef.current = latestFeedSync;
      setLastRefreshedAt(latestFeedSync);
    }
  }, [latestFeedSync]);

  const refreshCalendars = useCallback(async () => {
    if (refreshInFlight.current || document.visibilityState === "hidden")
      return;
    refreshInFlight.current = true;
    setIsRefreshing(true);
    try {
      await syncAllFeeds();
      // Friend blocks are fetched directly from the server by every calendar
      // view, so this revision refreshes them in the same pass as local feeds.
      requestFriendCalendarRefresh();
      const refreshedAt = new Date();
      lastRefreshedAtRef.current = refreshedAt;
      setLastRefreshedAt(refreshedAt);
    } finally {
      refreshInFlight.current = false;
      setIsRefreshing(false);
    }
  }, [requestFriendCalendarRefresh, syncAllFeeds]);

  useEffect(() => {
    // Refresh shortly after opening Calendar, then every five minutes while
    // the tab is visible. This keeps external API usage modest.
    const initialRefresh = window.setTimeout(
      () => void refreshCalendars(),
      1200
    );
    const interval = window.setInterval(
      () => void refreshCalendars(),
      5 * 60_000
    );
    const handleFocus = () => {
      if (
        !lastRefreshedAtRef.current ||
        Date.now() - lastRefreshedAtRef.current.getTime() >= 5 * 60_000
      ) {
        void refreshCalendars();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshCalendars]);

  const refreshTitle = lastRefreshedAt
    ? `Refresh calendars now. Last refreshed ${lastRefreshedAt.toLocaleString()}. Auto-refreshes every 5 minutes.`
    : "Refresh calendars now. Auto-refreshes every 5 minutes.";

  // Keep the calendar canvas usable before the layout reaches phone width.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1279px)").matches) {
      setSidebarOpen(false);
    }
    if (window.matchMedia("(max-width: 767px)").matches) {
      if (view === "week" || view === "multiMonth") {
        setView("day");
      }
    }
    // This is intentionally a one-time responsive initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrevWeek = () => {
    if (view === "month" || view === "multiMonth") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setDate(newDate);
    } else {
      const days = view === "day" ? 1 : 7;
      setDate(subDays(currentDate, days));
    }
  };

  const handleNextWeek = () => {
    if (view === "month" || view === "multiMonth") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setDate(newDate);
    } else {
      const days = view === "day" ? 1 : 7;
      setDate(addDays(currentDate, days));
    }
  };

  const handleAddEvent = () => {
    const now = newDate();
    const start = newDate(currentDate);
    const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
    start.setHours(now.getHours(), roundedMinutes, 0, 0);

    eventModalStore.setDefaultDate(start);
    eventModalStore.setDefaultEndDate(newDate(start.getTime() + 60 * 60_000));
    eventModalStore.setOpen(true);
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-50 h-full w-[min(20rem,86vw)] flex-none border-r border-[#dfe2c8] bg-[#fffdf5] shadow-2xl xl:relative xl:inset-auto xl:z-auto xl:w-80 xl:shadow-none",
          "transform transition-transform duration-300 ease-in-out",
          !isHydrated && "opacity-0 duration-0",
          isSidebarOpen
            ? "translate-x-0 xl:ml-0"
            : "-translate-x-full xl:-ml-80"
        )}
      >
        <button
          type="button"
          aria-label="Close calendar sidebar"
          onClick={() => setSidebarOpen(false)}
          className="absolute -right-4 top-4 z-[60] grid h-9 w-9 place-items-center rounded-full border border-[#d7d9bd] bg-[#fffdf5] text-[#5f6848] shadow-md transition hover:bg-[#eef3df]"
          title="Close calendar sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex h-full flex-col">
          {/* Feed Manager */}
          <div className="flex-1 overflow-y-auto">
            <FeedManager />
          </div>

          {/* Sponsorship Banner */}
          <SponsorshipBanner />
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close calendar sidebar"
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-40 bg-[#3f432e]/25 backdrop-blur-[1px] xl:hidden"
        />
      )}

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#fff9e8]">
        {/* Lifetime Access Banner */}
        <LifetimeAccessBanner />
        {/* Header */}
        <header className="relative z-30 flex flex-none flex-col gap-1.5 overflow-visible border-b border-[#dfe2c8] bg-[#fffdf5]/75 p-2 backdrop-blur-sm md:h-16 md:flex-row md:items-center md:gap-0 md:px-4">
          <div className="flex w-full min-w-0 items-center gap-1 md:w-auto">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d7d9bd] bg-[#fffdf5] text-[#5f6848] shadow-sm transition hover:bg-[#eef3df]"
                title="Open calendar sidebar (b)"
                aria-label="Open calendar sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <h1 className="min-w-0 flex-1 truncate px-2 text-base font-semibold text-foreground md:hidden">
              {formatDate(currentDate)}
            </h1>

            <div className="flex shrink-0 items-center gap-1 md:ml-4 md:gap-2">
              <button
                onClick={handlePrevWeek}
                className="rounded-lg p-1.5 text-foreground hover:bg-muted"
                data-testid="calendar-prev-week"
                title="Previous period"
              >
                <IoChevronBack className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                className="rounded-lg p-1.5 text-foreground hover:bg-muted"
                data-testid="calendar-next-week"
                title="Next period"
              >
                <IoChevronForward className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex w-full items-center gap-1 overflow-x-auto md:ml-3 md:w-auto md:gap-3 md:overflow-visible">
            <button
              onClick={() => setDate(newDate())}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted md:px-3"
              title="Go to Today (t)"
            >
              Today
            </button>

            <div className="group relative shrink-0">
              <button
                onClick={handleAutoSchedule}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
                aria-describedby="calendar-auto-schedule-tooltip"
              >
                <span className="md:hidden">Schedule</span>
                <span className="hidden md:inline">Auto Schedule</span>
              </button>
              <AutoScheduleTooltip
                id="calendar-auto-schedule-tooltip"
                align="left"
              />
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={handlePrevWeek}
                className="rounded-lg p-1.5 text-foreground hover:bg-muted"
                data-testid="calendar-prev-week"
                title="Previous Week (←)"
              >
                <IoChevronBack className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                className="rounded-lg p-1.5 text-foreground hover:bg-muted"
                data-testid="calendar-next-week"
                title="Next Week (→)"
              >
                <IoChevronForward className="h-5 w-5" />
              </button>
            </div>

            <h1 className="hidden whitespace-nowrap text-xl font-semibold text-foreground md:block">
              {formatDate(currentDate)}
            </h1>
          </div>

          {/* View Switching Buttons */}
          <div className="flex w-full shrink-0 items-center justify-between gap-1 md:ml-auto md:w-auto md:justify-start md:gap-2">
            <button
              type="button"
              onClick={() => void refreshCalendars()}
              disabled={isRefreshing}
              aria-label={refreshTitle}
              title={refreshTitle}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d7d9bd] bg-[#fffdf5] text-[#5f6848] transition hover:bg-[#eef3df] disabled:opacity-55"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </button>
            <button
              onClick={handleAddEvent}
              data-testid="add-event-button"
              className="mr-1 inline-flex items-center gap-1.5 rounded-xl bg-[#64734a] px-3 py-1.5 text-sm font-semibold text-white shadow-[0_2px_0_#465331] transition hover:-translate-y-0.5 md:mr-2"
            >
              <Plus className="h-4 w-4" />
              <span className="md:hidden lg:inline">Add event</span>
              <span className="hidden md:inline lg:hidden">Add</span>
            </button>
            <button
              onClick={() => setView("day")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium md:px-3",
                view === "day"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium md:px-3",
                view === "week"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium md:px-3",
                view === "month"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("multiMonth")}
              className={cn(
                "hidden rounded-lg px-3 py-1.5 text-sm font-medium md:block",
                view === "multiMonth"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Year
            </button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="relative z-0 flex-1 overflow-hidden">
          {view === "day" ? (
            <DayView currentDate={currentDate} onDateClick={setDate} />
          ) : view === "week" ? (
            <WeekView currentDate={currentDate} onDateClick={setDate} />
          ) : view === "month" ? (
            <MonthView currentDate={currentDate} onDateClick={setDate} />
          ) : (
            <MultiMonthView currentDate={currentDate} onDateClick={setDate} />
          )}
        </div>
      </main>
    </div>
  );
}
