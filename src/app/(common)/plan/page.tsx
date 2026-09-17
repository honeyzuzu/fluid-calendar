"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dices,
  Gauge,
  Loader2,
  MoonStar,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Sunrise,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  DailyRise,
  DailyUnwind,
  type MoodCheckIn,
  type RhythmTask,
  type UnwindTaskAction,
} from "@/components/planning/DailyRhythm";
import { MoodGarden } from "@/components/planning/MoodGarden";
import { WeeklyReview } from "@/components/planning/WeeklyReview";
import { getThemeMotifIcon } from "@/components/theme/ThemeMotifIcon";
import { SunnieSkeleton } from "@/components/ui/sunnie";

import { getColorTheme, resolveThemeLinkedColor } from "@/lib/color-themes";
import {
  type DailyCapacitySettings,
  calculateDailyCapacity,
  formatCapacityTime,
} from "@/lib/daily-capacity";
import {
  DAILY_INTENTION_UPDATED_EVENT,
  dateKeyInTimeZone,
  localDateKey,
  randomIntentionQuote,
} from "@/lib/daily-intention";
import {
  collectScheduleChanges,
  formatScheduleSummary,
  restoreScheduleChanges,
} from "@/lib/schedule-feedback";
import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/store/settings";

import type { DailyMoodEntry, MoodPhase } from "@/types/mood";

type TaskRecord = {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  duration: number | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  plannedWeekStart: string | null;
  isAutoScheduled?: boolean;
  scheduleLocked?: boolean;
  blockEventId?: string | null;
  blockFeedId?: string | null;
  project?: { name: string; color: string | null } | null;
  completedAt?: string | null;
};

type EventRecord = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  status?: string | null;
  externalEventId?: string | null;
  feedId?: string | null;
  color?: string | null;
  colorSlot?: string | null;
  feed?: {
    name: string;
    color: string | null;
    colorSlot?: string | null;
    enabled?: boolean;
  };
};

type CalendarSettingsRecord = {
  workingHoursEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingHoursDays: string;
};

type UserSettingsRecord = {
  timeZone: string;
};

type DailyPlanRecord = {
  id: string;
  intention: string | null;
  completedAt: string | null;
  dayVibe: string | null;
  unwindReflection: string;
  unwindCompletedAt: string | null;
};

function hasDateKey(value: string | null, key: string) {
  return value ? new Date(value).toISOString().slice(0, 10) === key : false;
}

function startOfLocalWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function isInLocalRange(value: string | null, start: Date, end: Date) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function formatTime(value: string, timeZone: string | null) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone && { timeZone }),
  }).format(new Date(value));
}

function isSameDayInTimeZone(
  value: string | null,
  dateKey: string,
  timeZone: string | null
) {
  if (!value) return false;
  return timeZone
    ? dateKeyInTimeZone(new Date(value), timeZone) === dateKey
    : localDateKey(new Date(value)) === dateKey;
}

function planDateTime(dateKey: string, time: string, timeZone: string | null) {
  const value = `${dateKey}T${time}`;
  return timeZone ? fromZonedTime(value, timeZone) : new Date(value);
}

function timeInputValue(value: string, timeZone: string | null) {
  return timeZone
    ? formatInTimeZone(new Date(value), timeZone, "HH:mm")
    : `${String(new Date(value).getHours()).padStart(2, "0")}:${String(
        new Date(value).getMinutes()
      ).padStart(2, "0")}`;
}

async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      message = (JSON.parse(text) as { error?: string }).error || text;
    } catch {
      // Keep a plain-text API error as-is.
    }
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export default function PlanPage() {
  const timeFormat = useSettingsStore((state) => state.user.timeFormat);
  const plannerColorTheme = getColorTheme(
    useSettingsStore((state) => state.user.colorTheme)
  );
  const IntentionIcon = getThemeMotifIcon(
    plannerColorTheme.motif.intentionIcon
  );
  const [view, setView] = useState<"today" | "week" | "review">("today");
  const [ritual, setRitual] = useState<"rise" | "unwind" | null>(null);
  const [requestedRitual, setRequestedRitual] = useState<
    "rise" | "unwind" | null
  >(null);
  const [urlReady, setUrlReady] = useState(false);
  const hasExplicitDate = useRef(false);
  const alignedInitialDate = useRef(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [workingHours, setWorkingHours] =
    useState<DailyCapacitySettings | null>(null);
  const [userTimeZone, setUserTimeZone] = useState<string | null>(null);
  const [plan, setPlan] = useState<DailyPlanRecord | null>(null);
  const [moodEntries, setMoodEntries] = useState<DailyMoodEntry[]>([]);
  const [previousPlan, setPreviousPlan] = useState<DailyPlanRecord | null>(
    null
  );
  const [intention, setIntention] = useState("");
  const [editingIntention, setEditingIntention] = useState(true);
  const [intentionJustSaved, setIntentionJustSaved] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState<"day" | "week" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedKey = localDateKey(selectedDate);
  const weekStart = useMemo(
    () => startOfLocalWeek(selectedDate),
    [selectedDate]
  );
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);
  const weekStartKey = localDateKey(weekStart);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const previousDate = new Date(selectedDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousKey = localDateKey(previousDate);
      const eventRangeStart = new Date(previousDate);
      eventRangeStart.setHours(0, 0, 0, 0);
      const eventRangeEnd = new Date(weekEnd);
      const eventRangeQuery = new URLSearchParams({
        start: eventRangeStart.toISOString(),
        end: eventRangeEnd.toISOString(),
      });
      const [
        taskData,
        eventData,
        planData,
        previousPlanData,
        settingsData,
        userSettingsData,
        moodData,
      ] = await Promise.all([
        fetch("/api/tasks").then((response) =>
          expectJson<TaskRecord[]>(response)
        ),
        fetch(`/api/events?${eventRangeQuery}`).then((response) =>
          expectJson<EventRecord[]>(response)
        ),
        fetch(`/api/daily-plan?date=${selectedKey}`).then((response) =>
          expectJson<DailyPlanRecord | null>(response)
        ),
        fetch(`/api/daily-plan?date=${previousKey}`).then((response) =>
          expectJson<DailyPlanRecord | null>(response)
        ),
        fetch("/api/calendar-settings")
          .then((response) => expectJson<CalendarSettingsRecord>(response))
          .catch(() => null),
        fetch("/api/user-settings").then((response) =>
          expectJson<UserSettingsRecord>(response)
        ),
        fetch(`/api/moods?date=${selectedKey}`).then((response) =>
          expectJson<DailyMoodEntry[]>(response)
        ),
      ]);
      setTasks(taskData);
      setEvents(eventData);
      setPlan(planData);
      setPreviousPlan(previousPlanData);
      setMoodEntries(moodData);
      setUserTimeZone(userSettingsData.timeZone);
      if (settingsData) {
        setWorkingHours({
          enabled: settingsData.workingHoursEnabled,
          start: settingsData.workingHoursStart,
          end: settingsData.workingHoursEnd,
          days: JSON.parse(settingsData.workingHoursDays) as number[],
        });
      }
      setIntention(planData?.intention ?? "");
      setEditingIntention(!planData?.intention?.trim());
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load your plan"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedKey, weekEnd]);

  useEffect(() => {
    if (urlReady) void load();
  }, [load, urlReady]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get("view");
    const requestedRitual = params.get("ritual");
    const requestedDate = params.get("date");
    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      hasExplicitDate.current = true;
      const date = new Date(`${requestedDate}T12:00:00`);
      if (!Number.isNaN(date.getTime())) setSelectedDate(date);
    }
    if (requestedView === "week" || requestedView === "review") {
      setView(requestedView);
    }
    if (requestedRitual === "rise" || requestedRitual === "unwind") {
      setView("today");
      setRequestedRitual(requestedRitual);
      window.history.replaceState({}, "", "/plan");
    }
    setUrlReady(true);
  }, []);

  const userTodayKey = userTimeZone
    ? dateKeyInTimeZone(new Date(), userTimeZone)
    : null;
  const isRitualDate = userTodayKey === selectedKey;

  useEffect(() => {
    if (!userTodayKey || hasExplicitDate.current || alignedInitialDate.current)
      return;
    alignedInitialDate.current = true;
    if (selectedKey !== userTodayKey) {
      setSelectedDate(new Date(`${userTodayKey}T12:00:00`));
    }
  }, [selectedKey, userTodayKey]);

  const openRitual = (nextRitual: "rise" | "unwind") => {
    if (
      !userTimeZone ||
      selectedKey !== dateKeyInTimeZone(new Date(), userTimeZone)
    ) {
      setError("Daily Rise and Daily Unwind are available for today.");
      return;
    }
    setRitual(nextRitual);
  };

  useEffect(() => {
    if (!requestedRitual || !userTodayKey || loading) return;
    if (selectedKey === userTodayKey) {
      setRitual(requestedRitual);
    } else {
      setError("Daily Rise and Daily Unwind are available for today.");
    }
    setRequestedRitual(null);
  }, [loading, requestedRitual, selectedKey, userTodayKey]);

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          ((!task.plannedWeekStart ||
            hasDateKey(task.plannedWeekStart, weekStartKey)) &&
            isSameDayInTimeZone(task.startDate, selectedKey, userTimeZone)) ||
          isSameDayInTimeZone(task.scheduledStart, selectedKey, userTimeZone)
      ),
    [selectedKey, tasks, userTimeZone, weekStartKey]
  );
  const weekTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "completed" &&
          (task.plannedWeekStart
            ? hasDateKey(task.plannedWeekStart, weekStartKey)
            : isInLocalRange(task.startDate, weekStart, weekEnd) ||
              isInLocalRange(task.scheduledStart, weekStart, weekEnd))
      ),
    [tasks, weekEnd, weekStart, weekStartKey]
  );
  const backlogTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            task.status !== "completed" &&
            !task.plannedWeekStart &&
            !weekTasks.some((weekTask) => weekTask.id === task.id)
        )
        .slice(0, 10),
    [tasks, weekTasks]
  );
  const dayEvents = useMemo(
    () =>
      events.filter((event) =>
        isSameDayInTimeZone(event.start, selectedKey, userTimeZone)
      ),
    [events, selectedKey, userTimeZone]
  );
  const plannedMinutes = todayTasks.reduce(
    (total, task) => total + (task.duration ?? 30),
    0
  );
  const completedTodayTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === "completed" &&
          isSameDayInTimeZone(
            task.completedAt ?? null,
            selectedKey,
            userTimeZone
          )
      ),
    [selectedKey, tasks, userTimeZone]
  );
  const unfinishedTodayTasks = todayTasks.filter(
    (task) => task.status !== "completed"
  );
  const carryoverTasks = useMemo(() => {
    if (previousPlan?.unwindCompletedAt) return [];
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousKey = localDateKey(previousDate);
    return tasks.filter(
      (task) =>
        task.status !== "completed" &&
        (isSameDayInTimeZone(task.startDate, previousKey, userTimeZone) ||
          isSameDayInTimeZone(task.scheduledStart, previousKey, userTimeZone))
    );
  }, [previousPlan?.unwindCompletedAt, selectedDate, tasks, userTimeZone]);
  const mirroredEventKeys = useMemo(
    () =>
      new Set(
        tasks
          .filter((task) => task.blockEventId && task.blockFeedId)
          .map((task) => `${task.blockFeedId}:${task.blockEventId}`)
      ),
    [tasks]
  );
  const earliestUnwindTaskDate = useMemo(() => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    return localDateKey(next);
  }, [selectedDate]);
  const capacity = useMemo(
    () =>
      calculateDailyCapacity(
        selectedDate,
        todayTasks,
        events.filter((event) => event.feed?.enabled !== false),
        workingHours
      ),
    [events, selectedDate, todayTasks, workingHours]
  );
  const capacityColor =
    capacity.state === "over"
      ? "bg-destructive"
      : capacity.state === "near"
        ? "bg-warning"
        : "bg-success";
  const capacityMessage =
    capacity.state === "unavailable"
      ? "This day is outside your configured work hours, so Sunnie is leaving it open-ended."
      : capacity.state === "over"
        ? `You’re planning ${formatCapacityTime(Math.abs(capacity.remainingMinutes ?? 0))} more than fits. Move a task or shorten the plan.`
        : capacity.state === "near"
          ? "This day is almost full. Leave a little breathing room if you can."
          : `${formatCapacityTime(capacity.remainingMinutes ?? 0)} still open for breaks and surprises.`;
  const scheduledTaskCount = todayTasks.filter(
    (task) => task.scheduledStart && task.scheduledEnd
  ).length;
  const planningSteps = [
    {
      label: "Set an intention",
      detail: plan?.intention?.trim()
        ? "Your direction is clear"
        : "Choose a gentle direction",
      complete: Boolean(plan?.intention?.trim()),
      icon: IntentionIcon,
      target: "intention-card",
    },
    {
      label: "Choose today’s tasks",
      detail:
        todayTasks.length > 0
          ? `${todayTasks.length} task${todayTasks.length === 1 ? "" : "s"} chosen`
          : "Pull in what matters",
      complete: todayTasks.length > 0,
      icon: CheckCircle2,
      target: "today-list",
    },
    {
      label: "Give them time",
      detail:
        scheduledTaskCount > 0
          ? `${scheduledTaskCount} time-blocked`
          : "Schedule around your calendar",
      complete:
        todayTasks.length > 0 && scheduledTaskCount >= todayTasks.length,
      icon: Clock3,
      target: "today-timeline",
    },
  ];
  const completedPlanningSteps = planningSteps.filter(
    (step) => step.complete
  ).length;

  const savePlan = async (
    completed?: boolean,
    celebrateIntention = false,
    intentionValue = intention
  ) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await fetch("/api/daily-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedKey,
          intention: intentionValue,
          ...(completed !== undefined && { completed }),
        }),
      }).then((response) => expectJson<DailyPlanRecord>(response));
      setPlan(saved);
      if (selectedKey === userTodayKey) {
        window.dispatchEvent(
          new CustomEvent(DAILY_INTENTION_UPDATED_EVENT, {
            detail: { date: selectedKey, intention: saved.intention },
          })
        );
      }
      if (celebrateIntention && saved.intention?.trim()) {
        setEditingIntention(false);
        setIntentionJustSaved(true);
        window.setTimeout(() => setIntentionJustSaved(false), 1600);
      }
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save your plan"
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveMood = async (phase: MoodPhase, checkIn: MoodCheckIn) => {
    const saved = await fetch("/api/moods", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedKey, phase, ...checkIn }),
    }).then((response) => expectJson<DailyMoodEntry | null>(response));
    setMoodEntries((current) => [
      ...current.filter((entry) => entry.phase !== phase),
      ...(saved ? [saved] : []),
    ]);
  };

  const finishRise = async (value: string, checkIn: MoodCheckIn) => {
    const tasksMissingEstimates = unfinishedTodayTasks.filter(
      (task) => task.duration == null
    );
    if (tasksMissingEstimates.length > 0) {
      setSaving(true);
      setError(null);
      try {
        await Promise.all(
          tasksMissingEstimates.map((task) =>
            fetch(`/api/tasks/${task.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ duration: 30 }),
            }).then((response) => expectJson<TaskRecord>(response))
          )
        );
        const missingIds = new Set(
          tasksMissingEstimates.map((task) => task.id)
        );
        setTasks((current) =>
          current.map((task) =>
            missingIds.has(task.id) ? { ...task, duration: 30 } : task
          )
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to save task estimates"
        );
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setIntention(value);
    if (await savePlan(true, true, value)) {
      setSaving(true);
      try {
        await saveMood("rise", checkIn);
        setRitual(null);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to save your morning check-in"
        );
      } finally {
        setSaving(false);
      }
    }
  };

  const finishUnwind = async (
    dayVibe: string | null,
    reflection: string,
    checkIn: MoodCheckIn
  ) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await fetch("/api/daily-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedKey,
          dayVibe,
          unwindReflection: reflection,
          unwindCompleted: true,
        }),
      }).then((response) => expectJson<DailyPlanRecord>(response));
      setPlan(saved);
      await saveMood("unwind", checkIn);
      setRitual(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save your Unwind"
      );
    } finally {
      setSaving(false);
    }
  };

  const placeUnfinishedTask = async (
    task: RhythmTask,
    action: UnwindTaskAction
  ) => {
    const clearSchedule = {
      scheduledStart: null,
      scheduledEnd: null,
      scheduleLocked: false,
    };
    if (action.kind === "done") {
      await updateTask(task.id, { status: "completed" });
      return;
    }
    if (action.kind === "backlog") {
      await updateTask(task.id, {
        ...clearSchedule,
        startDate: null,
        plannedWeekStart: null,
      });
      return;
    }
    if (action.kind === "week") {
      await updateTask(task.id, {
        ...clearSchedule,
        startDate: null,
        plannedWeekStart: `${weekStartKey}T00:00:00.000Z`,
      });
      return;
    }
    const target =
      action.kind === "tomorrow"
        ? (() => {
            const tomorrow = new Date(selectedDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
          })()
        : new Date(`${action.date}T00:00:00`);
    const targetKey = localDateKey(target);
    await updateTask(task.id, {
      ...clearSchedule,
      startDate: planDateTime(
        targetKey,
        "00:00:00",
        userTimeZone
      ).toISOString(),
      plannedWeekStart: `${localDateKey(startOfLocalWeek(target))}T00:00:00.000Z`,
    });
  };

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status: "todo",
          startDate: planDateTime(
            selectedKey,
            "00:00:00",
            userTimeZone
          ).toISOString(),
          plannedWeekStart: `${weekStartKey}T00:00:00.000Z`,
          duration: 30,
          priority: "medium",
        }),
      }).then((response) => expectJson<TaskRecord>(response));
      setNewTaskTitle("");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create task"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Record<string, unknown>
  ) => {
    setSaving(true);
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((response) => expectJson<TaskRecord>(response));
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update task"
      );
    } finally {
      setSaving(false);
    }
  };

  const scheduleTask = async (task: TaskRecord, time: string) => {
    if (!time) {
      await updateTask(task.id, { scheduledStart: null, scheduledEnd: null });
      return;
    }
    const start = planDateTime(selectedKey, `${time}:00`, userTimeZone);
    const end = new Date(start.getTime() + (task.duration ?? 30) * 60_000);
    await updateTask(task.id, {
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
      scheduleLocked: true,
    });
  };

  const autoSchedule = async (scope: "day" | "week") => {
    const candidates = (scope === "day" ? todayTasks : weekTasks).filter(
      (task) => task.status !== "completed" && task.isAutoScheduled !== false
    );
    if (candidates.length === 0) {
      setError(
        scope === "day"
          ? "Add at least one unfinished task to this day first."
          : "Add at least one unfinished task to this week first."
      );
      return;
    }

    const rangeStart =
      scope === "day"
        ? planDateTime(selectedKey, "00:00:00", userTimeZone)
        : new Date(weekStart);
    const rangeEnd = scope === "day" ? new Date(rangeStart) : new Date(weekEnd);
    if (scope === "day") rangeEnd.setDate(rangeEnd.getDate() + 1);

    setScheduling(scope);
    setError(null);
    try {
      const updatedTasks = await fetch("/api/tasks/schedule-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: candidates.map((task) => task.id),
          rangeStart: rangeStart.toISOString(),
          rangeEnd: rangeEnd.toISOString(),
        }),
      }).then((response) => expectJson<TaskRecord[]>(response));
      const changes = collectScheduleChanges(candidates, updatedTasks);
      await load();
      if (changes.length === 0) {
        toast.info("Your current schedule already fits", {
          description: formatScheduleSummary(
            changes,
            userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeFormat,
            scope === "day" ? "Selected day" : "Selected week"
          ),
        });
      } else {
        const taskLabel = changes.length === 1 ? "task" : "tasks";
        toast.success(`${changes.length} ${taskLabel} scheduled`, {
          description: formatScheduleSummary(
            changes,
            userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeFormat,
            scope === "day" ? "Selected day" : "Selected week"
          ),
          action: {
            label: "Undo",
            onClick: () => {
              void restoreScheduleChanges(changes)
                .then(async (restoredCount) => {
                  await load();
                  if (restoredCount === changes.length) {
                    toast.success("Schedule restored");
                  } else {
                    toast.info("Some newer changes were kept", {
                      description:
                        "Sunnie restored only the blocks that had not changed since scheduling.",
                    });
                  }
                })
                .catch(() =>
                  toast.error("Sunnie couldn't restore that schedule")
                );
            },
          },
        });
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to auto-schedule tasks"
      );
    } finally {
      setScheduling(null);
    }
  };

  const moveDate = (days: number) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + days);
      return next;
    });
  };

  const changeView = (next: "today" | "week" | "review") => {
    setView(next);
    window.history.replaceState(
      {},
      "",
      next === "today" ? "/plan" : `/plan?view=${next}`
    );
  };

  return (
    <div className="min-h-full w-full min-w-0 overflow-x-clip bg-background px-3 py-5 text-foreground min-[380px]:px-4 sm:px-5 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-[1440px]">
        <header className="sunnie-plan-hero relative mb-5 overflow-hidden rounded-[2rem] border border-border p-4 shadow-[var(--shadow-raised)] sm:p-5">
          <span aria-hidden="true" className="sunnie-plan-sticker-one" />
          <span aria-hidden="true" className="sunnie-plan-sticker-two" />
          <div className="relative flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div className="min-w-0 max-w-2xl">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/55 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Your daily rhythm
                </span>
              </div>
              <h1 className="sunnie-display-heading break-words text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">
                {view === "today"
                  ? "Shape a day that feels like yours."
                  : view === "week"
                    ? "Give the week a gentle shape."
                    : "Look back kindly, then begin again."}
              </h1>
              {view !== "review" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-secondary-foreground">
                  <span className="rounded-full bg-card/60 px-3 py-1.5 font-medium">
                    {!isRitualDate && "Viewing "}
                    {selectedDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="rounded-full bg-card/35 px-3 py-1.5">
                    {plannedMinutes} minutes planned
                  </span>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:items-end">
              {view !== "review" && (
                <div className="flex items-center gap-2 rounded-2xl bg-card/55 p-1.5 shadow-sm">
                  <button
                    onClick={() => moveDate(-1)}
                    aria-label="Previous day"
                    className="grid h-9 w-9 place-items-center rounded-xl bg-card/65 transition hover:bg-card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-card/70"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => moveDate(1)}
                    aria-label="Next day"
                    className="grid h-9 w-9 place-items-center rounded-xl bg-card/65 transition hover:bg-card"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              {view === "today" && isRitualDate && (
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                  <button
                    onClick={() => openRitual("rise")}
                    className="sunnie-rise-surface flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:brightness-95 disabled:opacity-50"
                  >
                    <Sunrise className="h-3.5 w-3.5" /> Daily Rise
                  </button>
                  <button
                    onClick={() => openRitual("unwind")}
                    className="sunnie-unwind-surface flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:brightness-95"
                  >
                    <MoonStar className="h-3.5 w-3.5" /> Daily Unwind
                  </button>
                </div>
              )}
              {view === "week" && (
                <button
                  onClick={() => void autoSchedule("week")}
                  disabled={scheduling !== null}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:opacity-50"
                >
                  {scheduling === "week" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CalendarDays className="h-3.5 w-3.5" />
                  )}
                  Schedule week
                </button>
              )}
            </div>
          </div>
        </header>

        <nav
          aria-label="Planning views"
          className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card/65 p-1.5 shadow-sm sm:mx-auto sm:max-w-lg"
        >
          {(
            [
              ["today", "Today"],
              ["week", "Week"],
              ["review", "Review"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => changeView(id)}
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                view === id
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card"
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="mb-5 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <PlanPageSkeleton />
        ) : (
          <div className="flex flex-col gap-5">
            <section
              className={cn(
                "sunnie-paper-panel order-1 min-w-0 max-w-full overflow-hidden rounded-3xl border border-border bg-card/70 shadow-[var(--shadow-paper)] backdrop-blur-sm",
                view !== "today" && "hidden"
              )}
            >
              <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    <IntentionIcon className="h-4 w-4" /> Your daily landing pad
                  </div>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                    A gentle rhythm for the day.
                  </h2>
                </div>
                <div className="w-full min-w-0 lg:w-48 lg:min-w-48">
                  <div className="flex items-center justify-between text-xs font-semibold text-secondary-foreground">
                    <span>Today’s plan</span>
                    <span>{completedPlanningSteps}/3 ready</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-card/75">
                    <motion.div
                      initial={false}
                      animate={{
                        width: `${(completedPlanningSteps / 3) * 100}%`,
                      }}
                      className="sunnie-plan-progress h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
              <div className="grid border-t border-border/60 sm:grid-cols-3">
                {planningSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => {
                        document
                          .querySelector(`[data-plan-section="${step.target}"]`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        if (step.target === "intention-card") {
                          setEditingIntention(true);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-5 py-4 text-left transition hover:bg-card/55",
                        index > 0 &&
                          "border-t border-border/60 sm:border-l sm:border-t-0"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-2xl",
                          step.complete
                            ? "bg-primary text-primary-foreground"
                            : "bg-card/80 text-muted-foreground"
                        )}
                      >
                        {step.complete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {step.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {step.detail}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div
                className={cn(
                  "border-t border-border/60 px-5 py-4",
                  capacity.state === "over"
                    ? "bg-destructive/10"
                    : capacity.state === "near"
                      ? "bg-warning/10"
                      : "bg-success/10"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-card/80 text-primary">
                      <Gauge className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Daily capacity</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {capacityMessage}
                      </p>
                    </div>
                  </div>
                  {capacity.capacityMinutes !== null && (
                    <div className="w-full shrink-0 sm:w-64">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <span>
                          {formatCapacityTime(capacity.taskMinutes)} tasks +{" "}
                          {formatCapacityTime(capacity.meetingMinutes)} meetings
                        </span>
                        <span>
                          {formatCapacityTime(capacity.capacityMinutes)} day
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-card/80">
                        <motion.div
                          initial={false}
                          animate={{
                            width: `${Math.min(100, (capacity.ratio ?? 0) * 100)}%`,
                          }}
                          className={cn("h-full rounded-full", capacityColor)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section
              className={cn(
                "sunnie-paper-panel order-3 min-w-0 max-w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card/85 to-accent/45 p-4 shadow-[var(--shadow-paper)] sm:p-6",
                view !== "week" && "hidden"
              )}
            >
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Zoom out
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Shape the week</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {weekStart.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    –{" "}
                    {new Date(weekEnd.getTime() - 1).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )}
                    . Move tasks from Backlog → This week → a day.
                  </p>
                </div>
                <span className="text-xs font-medium text-secondary-foreground">
                  {weekTasks.length} task{weekTasks.length === 1 ? "" : "s"}{" "}
                  this week
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="order-2 rounded-2xl border border-border bg-muted p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    This week
                  </p>
                  {weekTasks.length === 0 && (
                    <p className="py-3 text-xs text-muted-foreground">
                      No weekly tasks yet. Choose some from your backlog.
                    </p>
                  )}
                  <div className="grid gap-1 sm:grid-cols-2">
                    {weekTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex min-w-0 rounded-lg bg-card/75 hover:bg-card"
                      >
                        <button
                          disabled={isSameDayInTimeZone(
                            task.startDate,
                            selectedKey,
                            userTimeZone
                          )}
                          onClick={() =>
                            updateTask(task.id, {
                              startDate: planDateTime(
                                selectedKey,
                                "00:00:00",
                                userTimeZone
                              ).toISOString(),
                              plannedWeekStart: `${weekStartKey}T00:00:00.000Z`,
                            })
                          }
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs disabled:opacity-55"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate">
                            {task.title}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {isSameDayInTimeZone(
                              task.startDate,
                              selectedKey,
                              userTimeZone
                            )
                              ? "In day"
                              : "Add to day"}
                          </span>
                        </button>
                        <button
                          aria-label={`Remove ${task.title} from this week`}
                          onClick={() =>
                            updateTask(task.id, {
                              plannedWeekStart: null,
                              startDate: null,
                              scheduledStart: null,
                              scheduledEnd: null,
                              scheduleLocked: false,
                            })
                          }
                          className="grid w-8 shrink-0 place-items-center rounded-r-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="order-1 rounded-2xl border border-border bg-accent/65 p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Backlog
                  </p>
                  {backlogTasks.length === 0 && (
                    <p className="py-3 text-xs text-muted-foreground">
                      Everything is planned or completed.
                    </p>
                  )}
                  <div className="grid gap-1 sm:grid-cols-2">
                    {backlogTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() =>
                          updateTask(task.id, {
                            plannedWeekStart: `${weekStartKey}T00:00:00.000Z`,
                          })
                        }
                        className="flex min-w-0 items-center gap-2 rounded-lg bg-card/75 px-3 py-2 text-left text-xs hover:bg-card"
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1 truncate">
                          {task.title}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          Add to week
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div
              className={cn(
                "order-2 grid min-w-0 max-w-full gap-5 xl:grid-cols-2",
                view !== "today" && "hidden"
              )}
            >
              <section
                data-plan-section="today-list"
                className="sunnie-paper-panel order-2 min-w-0 max-w-full overflow-hidden rounded-3xl border border-border bg-card/80 shadow-[var(--shadow-paper)]"
              >
                <div className="border-b border-border/60 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Choose
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Today&apos;s tasks
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <p>Real tasks saved to your account.</p>
                    {todayTasks.length > 0 && (
                      <p
                        aria-live="polite"
                        className="font-semibold text-primary"
                      >
                        {
                          todayTasks.filter(
                            (task) => task.status === "completed"
                          ).length
                        }
                        /{todayTasks.length} complete
                      </p>
                    )}
                  </div>
                  <form onSubmit={createTask} className="mt-4 flex gap-2">
                    <input
                      value={newTaskTitle}
                      onChange={(event) => setNewTaskTitle(event.target.value)}
                      placeholder="Add a task for today"
                      className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      aria-label="Add task for today"
                      disabled={saving || !newTaskTitle.trim()}
                      className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                <div className="space-y-2 p-3">
                  {todayTasks.length === 0 && (
                    <p className="p-5 text-center text-sm text-muted-foreground">
                      Your day is open. Add a task or choose one from this week.
                    </p>
                  )}
                  {todayTasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-xl border border-border bg-card p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          aria-label={
                            task.status === "completed"
                              ? `Mark ${task.title} incomplete`
                              : `Mark ${task.title} complete`
                          }
                          title={
                            task.status === "completed"
                              ? "Mark incomplete"
                              : "Mark complete"
                          }
                          onClick={() =>
                            updateTask(task.id, {
                              status:
                                task.status === "completed"
                                  ? "todo"
                                  : "completed",
                            })
                          }
                          className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${task.status === "completed" ? "animate-[sunnie-sun-pop_500ms_ease-out] border-success bg-success text-success-foreground motion-reduce:animate-none" : "border-border hover:border-primary"}`}
                        >
                          {task.status === "completed" && (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <Clock3 className="h-3 w-3" />
                            {task.duration ?? 30}m
                            {task.project?.name && ` · ${task.project.name}`}
                            <label className="mt-1 flex w-full items-center justify-end gap-1.5 text-muted-foreground min-[380px]:ml-auto min-[380px]:mt-0 min-[380px]:w-auto">
                              Time
                              <input
                                type="time"
                                aria-label={`Schedule ${task.title}`}
                                defaultValue={
                                  task.scheduledStart &&
                                  isSameDayInTimeZone(
                                    task.scheduledStart,
                                    selectedKey,
                                    userTimeZone
                                  )
                                    ? timeInputValue(
                                        task.scheduledStart,
                                        userTimeZone
                                      )
                                    : ""
                                }
                                onChange={(event) =>
                                  void scheduleTask(task, event.target.value)
                                }
                                className="rounded-md border border-border bg-background px-1.5 py-1 text-[10px] text-foreground"
                              />
                            </label>
                            <button
                              onClick={() =>
                                updateTask(task.id, {
                                  startDate: null,
                                  scheduledStart: null,
                                  scheduledEnd: null,
                                  scheduleLocked: false,
                                })
                              }
                              className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            >
                              Remove from day
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <details className="group border-t border-border/60 p-4">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-secondary-foreground marker:hidden">
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5 transition group-open:rotate-45" />
                      Choose from this week
                    </span>
                  </summary>
                  <div className="mt-3">
                    {weekTasks.filter(
                      (task) =>
                        !isSameDayInTimeZone(
                          task.startDate,
                          selectedKey,
                          userTimeZone
                        )
                    ).length === 0 && (
                      <p className="py-3 text-xs text-muted-foreground">
                        No other weekly tasks waiting.
                      </p>
                    )}
                    {weekTasks
                      .filter(
                        (task) =>
                          !isSameDayInTimeZone(
                            task.startDate,
                            selectedKey,
                            userTimeZone
                          )
                      )
                      .slice(0, 8)
                      .map((task) => (
                        <button
                          key={task.id}
                          onClick={() =>
                            updateTask(task.id, {
                              startDate: planDateTime(
                                selectedKey,
                                "00:00:00",
                                userTimeZone
                              ).toISOString(),
                            })
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-muted"
                        >
                          <Plus className="h-3.5 w-3.5 text-primary" />
                          <span className="flex-1 truncate">{task.title}</span>
                          <span className="text-muted-foreground">
                            Add to day
                          </span>
                        </button>
                      ))}
                  </div>
                </details>
              </section>

              <section
                data-plan-section="today-timeline"
                className="sunnie-paper-panel order-3 min-w-0 max-w-full rounded-3xl border border-border bg-gradient-to-b from-muted to-card/85 p-4 shadow-[var(--shadow-paper)] sm:p-5"
              >
                <div className="mb-4">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    <CalendarDays className="h-4 w-4" /> Give it time
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Today&apos;s timeline
                  </h2>
                </div>
                <div className="space-y-2">
                  {[
                    ...dayEvents.map((event) => ({
                      id: `event-${event.id}`,
                      title: event.title,
                      start: event.start,
                      end: event.end,
                      type: event.feed?.name ?? "Calendar",
                      color: resolveThemeLinkedColor(
                        "events",
                        event.colorSlot || event.color
                          ? event.colorSlot
                          : event.feed?.colorSlot,
                        event.color || event.feed?.color,
                        plannerColorTheme.id
                      ),
                    })),
                    ...todayTasks
                      .filter(
                        (task) => task.scheduledStart && task.scheduledEnd
                      )
                      .map((task) => ({
                        id: `task-${task.id}`,
                        title: task.title,
                        start: task.scheduledStart!,
                        end: task.scheduledEnd!,
                        type: "Focus block",
                        color: plannerColorTheme.palettes.tasks[0].value,
                      })),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(a.start).getTime() -
                        new Date(b.start).getTime()
                    )
                    .map((item) => (
                      <article
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                      >
                        <span
                          className="h-10 w-1 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatTime(item.start, userTimeZone)} –{" "}
                            {formatTime(item.end, userTimeZone)} · {item.type}
                          </p>
                        </div>
                      </article>
                    ))}
                  {dayEvents.length === 0 &&
                    !todayTasks.some((task) => task.scheduledStart) && (
                      <div className="grid min-h-[280px] place-items-center rounded-xl border border-dashed border-border text-center">
                        <div>
                          <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Your events and focus blocks will appear here.
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </section>

              <aside className="order-1 min-w-0 max-w-full space-y-5 xl:col-span-2 xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-5 xl:space-y-0">
                <motion.section
                  data-plan-section="intention-card"
                  animate={
                    intentionJustSaved
                      ? { scale: [1, 1.025, 1], rotate: [0, -0.4, 0.4, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className={cn(
                    "relative overflow-hidden rounded-3xl p-5 transition-colors sm:p-6",
                    !editingIntention && plan?.intention?.trim()
                      ? "sunnie-intention-card-saved"
                      : "sunnie-intention-card"
                  )}
                >
                  <IntentionIcon
                    className="pointer-events-none absolute -right-6 -top-7 h-28 w-28 rotate-12 opacity-[0.08]"
                    aria-hidden="true"
                  />
                  <AnimatePresence>
                    {intentionJustSaved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="pointer-events-none absolute right-4 top-3 flex items-center gap-1 text-xs font-semibold"
                      >
                        <Sparkles className="h-4 w-4 text-accent-foreground" />{" "}
                        Saved!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!editingIntention && plan?.intention?.trim() ? (
                    <div className="relative max-w-3xl">
                      <div className="flex items-center gap-2 text-xs font-semibold opacity-75">
                        <IntentionIcon className="h-4 w-4" /> Today&apos;s
                        intention is set
                      </div>
                      <p className="mt-4 text-base font-medium leading-relaxed">
                        {plan.intention}
                      </p>
                      <button
                        onClick={() => setEditingIntention(true)}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold underline decoration-current/40 underline-offset-4"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Change intention
                      </button>
                    </div>
                  ) : (
                    <div className="relative max-w-3xl">
                      <div className="flex items-center gap-2 text-xs font-medium opacity-70">
                        <IntentionIcon className="h-3.5 w-3.5" />
                        Set your daily intention!
                      </div>
                      <textarea
                        value={intention}
                        onChange={(event) => setIntention(event.target.value)}
                        placeholder="What would make today meaningful?"
                        rows={5}
                        className="mt-4 w-full resize-none rounded-xl border border-current/20 bg-card/10 p-3 text-sm leading-relaxed text-current outline-none placeholder:text-current placeholder:opacity-40 focus:border-accent"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setIntention(randomIntentionQuote(intention))
                          }
                          className="flex items-center gap-1.5 rounded-lg bg-card/10 px-2.5 py-1.5 text-xs font-semibold opacity-85 hover:bg-card/15"
                        >
                          <Dices className="h-3.5 w-3.5" /> Inspire me
                        </button>
                        <button
                          onClick={() => savePlan(undefined, true)}
                          disabled={saving || !intention.trim()}
                          className="flex items-center gap-2 text-xs font-semibold disabled:opacity-40"
                        >
                          {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save intention
                        </button>
                      </div>
                    </div>
                  )}
                </motion.section>
                <button
                  onClick={() => savePlan(!plan?.completedAt)}
                  disabled={saving}
                  className={`flex w-full items-center justify-between rounded-3xl px-5 py-5 text-left shadow-sm transition xl:h-full ${plan?.completedAt ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground hover:brightness-95"}`}
                >
                  <span>
                    <span className="block text-sm font-semibold">
                      {plan?.completedAt
                        ? "Your day is planned"
                        : "Finish planning"}
                    </span>
                    <span className="mt-0.5 block text-[10px] opacity-70">
                      Saved to your account
                    </span>
                  </span>
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </button>
              </aside>
            </div>
          </div>
        )}
        <div className={cn((view !== "review" || loading) && "hidden")}>
          <MoodGarden
            initialMonth={selectedDate}
            onStartCheckIn={openRitual}
            refreshKey={moodEntries
              .map((entry) => `${entry.phase}:${entry.updatedAt}`)
              .join("|")}
          />
          <WeeklyReview
            onTasksChanged={() => {
              void fetch("/api/tasks")
                .then(expectJson<TaskRecord[]>)
                .then(setTasks)
                .catch((caught) =>
                  setError(
                    caught instanceof Error
                      ? caught.message
                      : "Unable to refresh tasks"
                  )
                );
            }}
          />
        </div>
        <DailyRise
          open={ritual === "rise"}
          onOpenChange={(open) => !open && setRitual(null)}
          dateLabel={selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          initialIntention={intention}
          initialMood={
            moodEntries.find((entry) => entry.phase === "rise") ?? null
          }
          todayTasks={unfinishedTodayTasks}
          carryoverTasks={carryoverTasks}
          availableTasks={weekTasks.filter(
            (task) =>
              !todayTasks.some((todayTask) => todayTask.id === task.id) &&
              !carryoverTasks.some((carryover) => carryover.id === task.id)
          )}
          capacityMessage={capacityMessage}
          busy={saving || scheduling !== null}
          onAddTask={async (task) => {
            await updateTask(task.id, {
              startDate: planDateTime(
                selectedKey,
                "00:00:00",
                userTimeZone
              ).toISOString(),
              plannedWeekStart: `${weekStartKey}T00:00:00.000Z`,
            });
          }}
          onDurationChange={async (task, duration) => {
            await updateTask(task.id, { duration });
          }}
          onSchedule={async () => {
            await autoSchedule("day");
          }}
          onFinish={finishRise}
        />
        <DailyUnwind
          open={ritual === "unwind"}
          onOpenChange={(open) => !open && setRitual(null)}
          completedTasks={completedTodayTasks}
          unfinishedTasks={unfinishedTodayTasks}
          endedEvents={dayEvents
            .filter(
              (event) =>
                !event.allDay &&
                event.status?.toLowerCase() !== "cancelled" &&
                event.status?.toLowerCase() !== "canceled" &&
                !mirroredEventKeys.has(
                  `${event.feedId}:${event.externalEventId}`
                ) &&
                new Date(event.end).getTime() <= Date.now()
            )
            .map((event) => ({
              id: event.id,
              title: event.title,
              start: event.start,
              end: event.end,
              calendarName: event.feed?.name ?? "Calendar",
            }))}
          timeZone={userTimeZone}
          initialVibe={plan?.dayVibe ?? null}
          initialMood={
            moodEntries.find((entry) => entry.phase === "unwind") ?? null
          }
          initialReflection={plan?.unwindReflection ?? ""}
          earliestTaskDate={earliestUnwindTaskDate}
          busy={saving}
          onTaskAction={placeUnfinishedTask}
          onFinish={finishUnwind}
        />
      </div>
    </div>
  );
}

function PlanPageSkeleton() {
  return (
    <div aria-label="Loading your plan" className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-border bg-card/70 p-5 shadow-[var(--shadow-paper)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <SunnieSkeleton className="h-3 w-36" />
            <SunnieSkeleton className="h-6 w-64 max-w-full" />
          </div>
          <SunnieSkeleton className="h-10 w-full sm:w-48" />
        </div>
        <div className="mt-5 grid gap-3 border-t border-border/60 pt-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <SunnieSkeleton className="h-10 w-10 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <SunnieSkeleton className="h-4 w-3/4" />
                <SunnieSkeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SunnieSkeleton className="h-72 rounded-3xl" />
        <SunnieSkeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}
