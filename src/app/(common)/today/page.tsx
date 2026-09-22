"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { fromZonedTime } from "date-fns-tz";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Cloud,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";

import { SunnieSkeleton } from "@/components/ui/sunnie";

import { getCalendarEventTitle } from "@/lib/calendar-event-title";
import {
  type CommitmentEnergyMode,
  type CommitmentEvent,
  type CommitmentHours,
  type CommitmentTask,
  hoursFromAutoScheduleSettings,
  suggestDailyCommitment,
} from "@/lib/daily-commitment";
import { dateKeyInTimeZone } from "@/lib/daily-intention";
import { cn } from "@/lib/utils";

type TodayTask = CommitmentTask & {
  title: string;
  completedAt?: string | null;
  project?: { name: string } | null;
};

type TodayPlan = {
  committedTaskIds: string[];
  commitmentSetAt: string | null;
  energyMode: CommitmentEnergyMode;
  recoveryMinutes: number;
  deferredTaskIds: string[];
};

type EnergyResult = {
  plan: TodayPlan;
  deferredCount: number;
  restoredCount: number;
  shallowScheduledCount: number;
  recoveryBlock: { start: string; end: string } | null;
};

type TodaySettings = { timeZone: string };
type CalendarHours = {
  workingHoursEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingHoursDays: string;
};
type AutoScheduleHours = {
  workDays: string;
  workHourStart: number;
  workHourEnd: number;
};

async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error || `Sunnie couldn't save that (${response.status}).`
    );
  }
  return response.json() as Promise<T>;
}

function prettyMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

function formatClock(value: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export default function TodayPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [events, setEvents] = useState<CommitmentEvent[]>([]);
  const [hours, setHours] = useState<CommitmentHours | null>(null);
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [hasCalendar, setHasCalendar] = useState<boolean | null>(null);
  const [captureTitle, setCaptureTitle] = useState("");
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await fetch("/api/user-settings").then((response) =>
        expectJson<TodaySettings>(response)
      );
      const zone =
        settings.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const key = dateKeyInTimeZone(new Date(), zone);
      const start = fromZonedTime(`${key}T00:00:00`, zone);
      const next = new Date(`${key}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      const end = fromZonedTime(
        `${next.toISOString().slice(0, 10)}T00:00:00`,
        zone
      );
      const range = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const [
        taskData,
        eventData,
        planData,
        calendarData,
        autoScheduleData,
        feedData,
      ] = await Promise.all([
        fetch("/api/tasks").then((response) =>
          expectJson<TodayTask[]>(response)
        ),
        fetch(`/api/events?${range}`).then((response) =>
          expectJson<CommitmentEvent[]>(response)
        ),
        fetch(`/api/daily-plan?date=${key}`).then((response) =>
          expectJson<TodayPlan | null>(response)
        ),
        fetch("/api/calendar-settings")
          .then((response) => expectJson<CalendarHours>(response))
          .catch(() => null),
        fetch("/api/auto-schedule-settings")
          .then((response) => expectJson<AutoScheduleHours>(response))
          .catch(() => null),
        fetch("/api/feeds")
          .then((response) => expectJson<{ id: string }[]>(response))
          .catch(() => null),
      ]);
      let workHours: CommitmentHours | null = null;
      if (calendarData) {
        workHours = {
          enabled: calendarData.workingHoursEnabled,
          start: calendarData.workingHoursStart,
          end: calendarData.workingHoursEnd,
          days: JSON.parse(calendarData.workingHoursDays) as number[],
        };
      }
      if (autoScheduleData) {
        workHours = hoursFromAutoScheduleSettings(autoScheduleData);
      }
      let savedPlan = planData;
      if (!savedPlan?.commitmentSetAt) {
        const suggestion = suggestDailyCommitment({
          dateKey: key,
          timeZone: zone,
          energyMode: "normal",
          tasks: taskData,
          events: eventData,
          hours: workHours,
        });
        savedPlan = await fetch("/api/daily-plan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: key,
            committedTaskIds: suggestion.taskIds,
            energyMode: "normal",
            recoveryMinutes: 0,
          }),
        }).then((response) => expectJson<TodayPlan>(response));
      }
      setDateKey(key);
      setTimeZone(zone);
      setTasks(taskData);
      setEvents(eventData);
      setHours(workHours);
      setPlan(savedPlan);
      setHasCalendar(feedData ? feedData.length > 0 : null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Couldn't open today."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date();
      setNow(current);
      if (timeZone && dateKeyInTimeZone(current, timeZone) !== dateKey) {
        void load();
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [dateKey, load, timeZone]);

  const energyMode = plan?.energyMode ?? "normal";
  const suggestion = useMemo(
    () =>
      dateKey && timeZone
        ? suggestDailyCommitment({
            dateKey,
            timeZone,
            energyMode,
            tasks,
            events,
            hours,
            now,
          })
        : null,
    [dateKey, energyMode, events, hours, now, tasks, timeZone]
  );
  const committedIds = plan?.committedTaskIds ?? [];
  const committedTasks = committedIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is TodayTask => Boolean(task));
  const completedCount = committedTasks.filter(
    (task) => task.status === "completed"
  ).length;
  const remainingCommitmentMinutes = committedTasks
    .filter((task) => task.status !== "completed")
    .reduce((total, task) => total + Math.max(5, task.duration ?? 30), 0);
  const nextTask = committedTasks.find((task) => task.status !== "completed");
  const outsideTasks = tasks.filter(
    (task) => task.status !== "completed" && !committedIds.includes(task.id)
  );
  const urgentOutside = outsideTasks.filter(
    (task) =>
      task.dueDate &&
      task.dueDate.slice(0, 10) <= dateKey &&
      (!task.postponedUntil || new Date(task.postponedUntil) <= new Date())
  );
  const scheduledOutside = outsideTasks.filter(
    (task) =>
      task.scheduledStart &&
      dateKeyInTimeZone(new Date(task.scheduledStart), timeZone) === dateKey
  );
  const upcomingEvent = events
    .filter(
      (event) =>
        !event.allDay &&
        event.status?.toLowerCase() !== "cancelled" &&
        new Date(event.end).getTime() > now.getTime()
    )
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )[0];
  const currentEvent = upcomingEvent && new Date(upcomingEvent.start) <= now;
  const recoveryEvent = events.find((event) =>
    event.externalEventId?.startsWith("sunnie-recovery-event:")
  );
  const doneEnough =
    committedTasks.length > 0 &&
    completedCount === committedTasks.length &&
    urgentOutside.length === 0 &&
    scheduledOutside.length === 0;
  const workday = Boolean(
    hours?.enabled &&
      hours.days.includes(new Date(`${dateKey}T12:00:00Z`).getUTCDay())
  );

  const refreshDayData = async () => {
    const start = fromZonedTime(`${dateKey}T00:00:00`, timeZone);
    const nextDate = new Date(`${dateKey}T12:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const end = fromZonedTime(
      `${nextDate.toISOString().slice(0, 10)}T00:00:00`,
      timeZone
    );
    const range = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    const [freshTasks, freshEvents] = await Promise.all([
      fetch("/api/tasks").then((response) => expectJson<TodayTask[]>(response)),
      fetch(`/api/events?${range}`).then((response) =>
        expectJson<CommitmentEvent[]>(response)
      ),
    ]);
    setTasks(freshTasks);
    setEvents(freshEvents);
  };

  const saveCommitment = async (
    ids: string[],
    mode = energyMode,
    recoveryMinutes = plan?.recoveryMinutes ?? 0
  ) => {
    if (!dateKey) return false;
    setBusy(true);
    setError(null);
    try {
      if (mode === "low") {
        const result = await fetch("/api/daily-plan/energy", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateKey,
            energyMode: mode,
            committedTaskIds: ids,
          }),
        }).then((response) => expectJson<EnergyResult>(response));
        setPlan(result.plan);
        await refreshDayData();
        setAnnouncement("Today's commitment and recovery block are updated.");
        return true;
      }
      const saved = await fetch("/api/daily-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          committedTaskIds: ids,
          energyMode: mode,
          recoveryMinutes,
        }),
      }).then((response) => expectJson<TodayPlan>(response));
      setPlan(saved);
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Couldn't update today."
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changeEnergy = async () => {
    if (!dateKey || !timeZone) return;
    const mode: CommitmentEnergyMode =
      energyMode === "normal" ? "low" : "normal";
    const next = suggestDailyCommitment({
      dateKey,
      timeZone,
      energyMode: mode,
      tasks,
      events,
      hours,
      now,
    });
    const alreadyDone = committedTasks
      .filter((task) => task.status === "completed")
      .map((task) => task.id);
    const essential = committedTasks
      .filter(
        (task) =>
          task.status !== "completed" &&
          Math.max(5, task.duration ?? 30) <= next.usableMinutes
      )
      .sort((a, b) => {
        const urgency = (task: TodayTask) =>
          (task.dueDate && task.dueDate.slice(0, 10) <= dateKey ? 2 : 0) +
          (task.priority === "high" ? 1 : 0);
        return urgency(b) - urgency(a);
      })[0];
    const maxActive = Math.min(
      mode === "low" ? 2 : 3,
      Math.max(0, 12 - alreadyDone.length)
    );
    const activeIds: string[] = [];
    let activeMinutes = 0;
    for (const id of new Set([
      ...(essential ? [essential.id] : []),
      ...next.taskIds,
    ])) {
      if (activeIds.length >= maxActive) break;
      const task = tasks.find((item) => item.id === id);
      if (!task) continue;
      const duration = Math.max(5, task.duration ?? 30);
      if (activeMinutes + duration > next.usableMinutes) continue;
      activeIds.push(id);
      activeMinutes += duration;
    }
    const ids = [...new Set([...alreadyDone, ...activeIds])];
    setBusy(true);
    setError(null);
    try {
      const result = await fetch("/api/daily-plan/energy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          energyMode: mode,
          committedTaskIds: ids,
        }),
      }).then((response) => expectJson<EnergyResult>(response));
      setPlan(result.plan);
      await refreshDayData();
      if (mode === "low") {
        const moved = result.deferredCount;
        setAnnouncement(
          `A lighter commitment is ready. ${moved} flexible ${moved === 1 ? "block was" : "blocks were"} moved off today's calendar. ${result.recoveryBlock ? `Recovery is booked at ${formatClock(result.recoveryBlock.start, timeZone)}.` : "No open recovery block fits before your stop time."} ${result.shallowScheduledCount ? `${result.shallowScheduledCount} low-energy ${result.shallowScheduledCount === 1 ? "task was" : "tasks were"} placed after recovery.` : ""}`
        );
      } else {
        setAnnouncement(
          `Normal capacity is back. ${result.restoredCount} deferred ${result.restoredCount === 1 ? "task is" : "tasks are"} available to schedule again.`
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Couldn't update today."
      );
    } finally {
      setBusy(false);
    }
  };

  const completeTask = async (task: TodayTask) => {
    setBusy(true);
    setError(null);
    const previous = tasks;
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item
      )
    );
    try {
      const updated = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
        }),
      }).then((response) => expectJson<TodayTask>(response));
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, ...updated } : item
        )
      );
    } catch (caught) {
      setTasks(previous);
      setError(
        caught instanceof Error ? caught.message : "Couldn't update the task."
      );
    } finally {
      setBusy(false);
    }
  };

  const capture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = captureTitle.trim();
    if (!title) return;
    const addToToday =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
        "data-placement"
      ) === "today";
    setBusy(true);
    setError(null);
    try {
      const created = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status: "todo", isAutoScheduled: false }),
      }).then((response) => expectJson<TodayTask>(response));
      setTasks((current) => [created, ...current]);
      setCaptureTitle("");
      if (addToToday) {
        const committed = await saveCommitment([...committedIds, created.id]);
        if (committed)
          setAnnouncement("Added to today. You can start when ready.");
      } else {
        setAnnouncement(
          "Saved for later. It hasn't been added to today's commitment."
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Couldn't save that thought."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        aria-label="Loading today"
        className="mx-auto max-w-5xl space-y-4 p-4 sm:p-8"
      >
        <SunnieSkeleton className="h-20 rounded-2xl" />
        <SunnieSkeleton className="h-60 rounded-2xl" />
        <SunnieSkeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  if (!plan || !suggestion) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <h1 className="text-2xl font-semibold">Today needs a moment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "Sunnie couldn't load your plan."}
        </p>
        <button
          onClick={() => void load()}
          className="mt-5 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background px-4 py-5 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-secondary-foreground">
              {new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                timeZone,
              }).format(new Date())}
            </p>
            <h1 className="mt-0.5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Today
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void changeEnergy()}
            disabled={busy}
            aria-pressed={energyMode === "low"}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              energyMode === "low"
                ? "border-primary bg-muted text-primary"
                : "border-border bg-card text-secondary-foreground hover:bg-muted"
            )}
          >
            <Cloud className="h-4 w-4" />
            {energyMode === "low" ? "Low-energy day on" : "Low-energy day"}
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
          >
            {error}
          </p>
        )}
        {announcement && (
          <p
            role="status"
            className="rounded-xl border border-border bg-muted p-3 text-sm"
          >
            {announcement}
          </p>
        )}

        <section
          aria-label="What to do now"
          className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-paper)] sm:p-6"
        >
          {doneEnough ? (
            <div className="py-3 text-center sm:py-6">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success text-success-foreground">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                You&apos;ve done enough for today.
              </h2>
              <p className="mt-2 text-sm text-secondary-foreground">
                Your other tasks can wait. Go live your life.
              </p>
            </div>
          ) : nextTask ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">
                  {suggestion.usableMinutes === 0
                    ? "Your work window has ended"
                    : "What to do now"}
                </p>
                <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                  {nextTask.title}
                </h2>
                <p className="mt-2 text-sm text-secondary-foreground">
                  {suggestion.usableMinutes === 0
                    ? "This can wait until your next work window, or you can start now"
                    : prettyMinutes(nextTask.duration ?? 30)}
                  {nextTask.project?.name ? ` · ${nextTask.project.name}` : ""}
                  {nextTask.dueDate && nextTask.dueDate.slice(0, 10) <= dateKey
                    ? " · Due today or overdue"
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void completeTask(nextTask)}
                  disabled={busy}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Done
                </button>
                <Link
                  href={`/focus?taskId=${encodeURIComponent(nextTask.id)}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pressed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Start focus <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : urgentOutside.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-primary">
                A deadline needs a decision
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {urgentOutside[0].title}
              </h2>
              <p className="mt-2 text-sm text-secondary-foreground">
                This is due or overdue and sits outside today&apos;s commitment.
              </p>
              <Link
                href="/tasks"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Review deadlines <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : scheduledOutside.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-primary">
                A calendar block needs a decision
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {scheduledOutside[0].title}
              </h2>
              <p className="mt-2 text-sm text-secondary-foreground">
                This task is still on today&apos;s calendar outside your
                commitment.
              </p>
              <Link
                href="/calendar"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Review calendar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-primary">
                What to do now
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Your day is open.</h2>
              <p className="mt-2 text-sm text-secondary-foreground">
                {tasks.length === 0
                  ? "Add one thing to do today, or save a thought for later."
                  : "Choose one meaningful thing below, or leave the space open."}
              </p>
            </div>
          )}
        </section>

        {hasCalendar === false && (
          <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-secondary-foreground">
            <span>
              Your tasks work now. Connect a calendar when you want Sunnie to
              plan around events.
            </span>
            <Link
              href="/settings#accounts"
              className="shrink-0 font-semibold text-primary underline underline-offset-4"
            >
              Connect calendar
            </Link>
          </p>
        )}

        <section
          aria-label="Quick capture"
          className="rounded-2xl border border-border bg-card px-4 py-3 sm:px-5"
        >
          <form onSubmit={capture} className="flex items-center gap-2">
            <label htmlFor="today-quick-capture" className="sr-only">
              Capture a thought for later
            </label>
            <input
              id="today-quick-capture"
              value={captureTitle}
              onChange={(event) => setCaptureTitle(event.target.value)}
              placeholder="Something on your mind? Save it for later…"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            {!nextTask && committedIds.length < 12 && (
              <button
                type="submit"
                data-placement="today"
                disabled={busy || !captureTitle.trim()}
                className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                Do today
              </button>
            )}
            <button
              type="submit"
              data-placement="later"
              disabled={busy || !captureTitle.trim()}
              aria-label="Save thought for later"
              className={cn(
                "grid h-10 shrink-0 place-items-center rounded-xl disabled:opacity-40",
                !nextTask && committedIds.length < 12
                  ? "px-2 text-xs font-semibold text-primary"
                  : "w-10 bg-primary text-primary-foreground"
              )}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !nextTask && committedIds.length < 12 ? (
                "Later"
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </form>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section
            aria-label="Today's commitment"
            className="rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Enough for today</h2>
                <p className="mt-1 text-sm text-secondary-foreground">
                  {completedCount} of {committedTasks.length} committed tasks
                  done
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-secondary-foreground">
                {completedCount}/{committedTasks.length}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Today's commitment completed"
              aria-valuemin={0}
              aria-valuemax={Math.max(1, committedTasks.length)}
              aria-valuenow={completedCount}
              className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{
                  width: `${committedTasks.length ? (completedCount / committedTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {committedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => void completeTask(task)}
                    disabled={busy}
                    aria-label={
                      task.status === "completed"
                        ? `Mark ${task.title} incomplete`
                        : `Mark ${task.title} complete`
                    }
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                      task.status === "completed"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card"
                    )}
                  >
                    {task.status === "completed" && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "min-w-0 flex-1 break-words text-sm font-medium",
                      task.status === "completed" &&
                        "text-muted-foreground line-through"
                    )}
                  >
                    {task.title}
                  </span>
                  {task.status !== "completed" && task.id !== nextTask?.id && (
                    <button
                      type="button"
                      onClick={() =>
                        void saveCommitment([
                          task.id,
                          ...committedIds.filter((id) => id !== task.id),
                        ])
                      }
                      disabled={busy}
                      aria-label={`Do ${task.title} next`}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-muted disabled:opacity-50"
                    >
                      Do next
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      void saveCommitment(
                        committedIds.filter((id) => id !== task.id)
                      )
                    }
                    disabled={busy}
                    aria-label={`Move ${task.title} out of today's commitment`}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Later
                  </button>
                </div>
              ))}
              {committedTasks.length === 0 && (
                <p className="py-3 text-sm text-secondary-foreground">
                  Nothing has to be done to earn a good day.
                </p>
              )}
            </div>
            {suggestion.usableMinutes > 0 &&
              remainingCommitmentMinutes > suggestion.usableMinutes && (
                <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                  This commitment needs about{" "}
                  {prettyMinutes(remainingCommitmentMinutes)}, but only{" "}
                  {prettyMinutes(suggestion.usableMinutes)} fits before your
                  stop time. Move something to later.
                </p>
              )}
            {urgentOutside.length > 0 && (
              <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                {urgentOutside.length} due or overdue{" "}
                {urgentOutside.length === 1 ? "task is" : "tasks are"} outside
                this commitment.{" "}
                <Link href="/tasks" className="font-semibold underline">
                  Review deadlines
                </Link>
              </p>
            )}
            <details className="group mt-4 border-t border-border pt-3">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-primary">
                Adjust today&apos;s commitment{" "}
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <div className="mt-3 space-y-2">
                {outsideTasks.slice(0, 8).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() =>
                      void saveCommitment([...committedIds, task.id])
                    }
                    disabled={busy || committedIds.length >= 12}
                    className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">
                      {task.title}
                    </span>
                    {task.dueDate && task.dueDate.slice(0, 10) <= dateKey && (
                      <span className="text-xs font-semibold text-destructive">
                        Due
                      </span>
                    )}
                  </button>
                ))}
                {outsideTasks.length === 0 && (
                  <p className="text-sm text-secondary-foreground">
                    No other active tasks.
                  </p>
                )}
                <Link
                  href="/tasks"
                  className="inline-block pt-1 text-sm font-semibold text-primary underline"
                >
                  See all tasks
                </Link>
              </div>
            </details>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">The rest of your day</h2>
              {upcomingEvent ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-secondary-foreground">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {currentEvent
                      ? `Current block until ${formatClock(upcomingEvent.end, timeZone)}`
                      : `Next calendar block at ${formatClock(upcomingEvent.start, timeZone)}`}
                    {upcomingEvent.title
                      ? ` · ${getCalendarEventTitle({ ...upcomingEvent, title: upcomingEvent.title })}`
                      : ""}
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-secondary-foreground">
                  No upcoming calendar blocks today.
                </p>
              )}
              <p className="mt-3 text-sm text-secondary-foreground">
                {workday
                  ? suggestion.usableMinutes === 0
                    ? "Your work window has ended. There is no need to fill the evening."
                    : `About ${prettyMinutes(suggestion.usableMinutes)} of workable time, with ${prettyMinutes(suggestion.bufferMinutes)} left for breaks and transitions.`
                  : "Outside your regular work hours, Sunnie keeps the commitment light."}
              </p>
              {energyMode === "low" && (
                <p className="mt-3 rounded-xl bg-muted p-3 text-sm text-secondary-foreground">
                  {recoveryEvent
                    ? `Recovery is booked from ${formatClock(recoveryEvent.start, timeZone)} to ${formatClock(recoveryEvent.end, timeZone)} on your Sunnie calendar.`
                    : "Sunnie reduced today's capacity for rest. No open recovery block fits before your stop time."}
                </p>
              )}
              {scheduledOutside.length > 0 && (
                <p className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                  {scheduledOutside.length}{" "}
                  {scheduledOutside.length === 1
                    ? "task remains"
                    : "tasks remain"}{" "}
                  on today&apos;s calendar outside this commitment.{" "}
                  <Link href="/calendar" className="font-semibold underline">
                    Review those blocks
                  </Link>
                </p>
              )}
              <Link
                href="/calendar"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary underline"
              >
                Open calendar <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-4 text-sm text-secondary-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Want to look further ahead?</span>
          <Link
            href="/upcoming"
            className="font-semibold text-primary underline"
          >
            Open Upcoming
          </Link>
        </div>
      </div>
    </div>
  );
}
