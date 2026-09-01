"use client";

import { useEffect } from "react";

import dynamic from "next/dynamic";
import { HiMenu } from "react-icons/hi";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { DayView } from "@/components/calendar/DayView";
import { FeedManager } from "@/components/calendar/FeedManager";
import { MonthView } from "@/components/calendar/MonthView";
import { MultiMonthView } from "@/components/calendar/MultiMonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { AutoScheduleTooltip } from "@/components/tasks/AutoScheduleTooltip";
import { SponsorshipBanner } from "@/components/ui/sponsorship-banner";

import { useAutoSchedule } from "@/hooks/use-auto-schedule";

import { addDays, formatDate, newDate, subDays } from "@/lib/date-utils";
import { isSaasEnabled } from "@/lib/config";
import { cn } from "@/lib/utils";

import {
  useCalendarStore,
  useCalendarUIStore,
  useViewStore,
} from "@/store/calendar";
import { useTaskStore } from "@/store/task";

import { CalendarEvent, CalendarFeed } from "@/types/calendar";

// Dynamically import the appropriate version of the LifetimeAccessBanner
const LifetimeAccessBanner = dynamic(
  () => import(`./LifetimeAccessBanner.${isSaasEnabled ? "saas" : "open"}`).then(
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
  const { isSidebarOpen, setSidebarOpen, isHydrated } = useCalendarUIStore();
  const { setFeeds, setEvents } = useCalendarStore();
  const handleAutoSchedule = useAutoSchedule();

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

  // The desktop week layout and open sidebar are too dense for a phone.
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
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

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-50 h-full w-[min(20rem,86vw)] flex-none border-r border-[#dfe2c8] bg-[#fffdf5] shadow-2xl md:relative md:inset-auto md:z-auto md:w-80 md:shadow-none",
          "transform transition-transform duration-300 ease-in-out",
          !isHydrated && "opacity-0 duration-0",
          isSidebarOpen
            ? "translate-x-0 md:ml-0"
            : "-translate-x-full md:-ml-80"
        )}
      >
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
          className="absolute inset-0 z-40 bg-[#3f432e]/25 backdrop-blur-[1px] md:hidden"
        />
      )}

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#fff9e8]">
        {/* Lifetime Access Banner */}
        <LifetimeAccessBanner />
        {/* Header */}
        <header className="relative z-30 flex flex-none flex-col gap-1.5 overflow-visible border-b border-[#dfe2c8] bg-[#fffdf5]/75 p-2 backdrop-blur-sm md:h-16 md:flex-row md:items-center md:gap-0 md:px-4">
          <div className="flex w-full min-w-0 items-center gap-1 md:w-auto">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="shrink-0 rounded-lg p-2 text-foreground hover:bg-muted"
              title="Toggle Sidebar (b)"
            >
              <HiMenu className="h-5 w-5" />
            </button>

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
