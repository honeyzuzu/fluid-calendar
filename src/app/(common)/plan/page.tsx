"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";

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
  project?: { name: string; color: string | null } | null;
};

type EventRecord = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  feed?: { name: string; color: string | null };
};

type DailyPlanRecord = {
  id: string;
  intention: string | null;
  completedAt: string | null;
};

type FriendBlock = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  owner: string;
  color: string;
  source: "calendar" | "focus";
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameLocalDay(value: string | null, selectedDate: Date) {
  if (!value) return false;
  const date = new Date(value);
  return (
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate()
  );
}

function hasDateKey(value: string | null, key: string) {
  return value ? new Date(value).toISOString().slice(0, 10) === key : false;
}

function startOfLocalWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

function isInLocalRange(value: string | null, start: Date, end: Date) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export default function PlanPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [friendBlocks, setFriendBlocks] = useState<FriendBlock[]>([]);
  const [plan, setPlan] = useState<DailyPlanRecord | null>(null);
  const [intention, setIntention] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState<"day" | "week" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedKey = dateKey(selectedDate);
  const weekStart = useMemo(
    () => startOfLocalWeek(selectedDate),
    [selectedDate]
  );
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);
  const weekStartKey = dateKey(weekStart);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rangeStart = new Date(`${selectedKey}T00:00:00`);
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
      const [taskData, eventData, planData, sharedData] = await Promise.all([
        fetch("/api/tasks").then((response) =>
          expectJson<TaskRecord[]>(response)
        ),
        fetch("/api/events").then((response) =>
          expectJson<EventRecord[]>(response)
        ),
        fetch(`/api/daily-plan?date=${selectedKey}`).then((response) =>
          expectJson<DailyPlanRecord | null>(response)
        ),
        fetch(
          `/api/friends/events?start=${encodeURIComponent(rangeStart.toISOString())}&end=${encodeURIComponent(rangeEnd.toISOString())}`
        ).then((response) => expectJson<FriendBlock[]>(response)),
      ]);
      setTasks(taskData);
      setEvents(eventData);
      setFriendBlocks(sharedData);
      setPlan(planData);
      setIntention(planData?.intention ?? "");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load your plan"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          isSameLocalDay(task.startDate, selectedDate) ||
          isSameLocalDay(task.scheduledStart, selectedDate)
      ),
    [selectedDate, tasks]
  );
  const weekTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "completed" &&
          (hasDateKey(task.plannedWeekStart, weekStartKey) ||
            isInLocalRange(task.startDate, weekStart, weekEnd) ||
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
            !weekTasks.some((weekTask) => weekTask.id === task.id)
        )
        .slice(0, 10),
    [tasks, weekTasks]
  );
  const dayEvents = useMemo(
    () => events.filter((event) => isSameLocalDay(event.start, selectedDate)),
    [events, selectedDate]
  );
  const plannedMinutes = todayTasks.reduce(
    (total, task) => total + (task.duration ?? 30),
    0
  );

  const savePlan = async (completed?: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await fetch("/api/daily-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedKey,
          intention,
          ...(completed !== undefined && { completed }),
        }),
      }).then((response) => expectJson<DailyPlanRecord>(response));
      setPlan(saved);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save your plan"
      );
    } finally {
      setSaving(false);
    }
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
          startDate: new Date(`${selectedKey}T00:00:00`).toISOString(),
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
    const start = new Date(`${selectedKey}T${time}:00`);
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
        ? new Date(`${selectedKey}T00:00:00`)
        : new Date(weekStart);
    const rangeEnd = scope === "day" ? new Date(rangeStart) : new Date(weekEnd);
    if (scope === "day") rangeEnd.setDate(rangeEnd.getDate() + 1);

    setScheduling(scope);
    setError(null);
    try {
      await fetch("/api/tasks/schedule-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: candidates.map((task) => task.id),
          rangeStart: rangeStart.toISOString(),
          rangeEnd: rangeEnd.toISOString(),
        }),
      }).then((response) => expectJson<TaskRecord[]>(response));
      await load();
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

  return (
    <div className="min-h-full bg-[#fff9e8] p-5 text-[#3f432e] lg:p-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c65f40]">
              <Sparkles className="h-3.5 w-3.5" /> Daily planning
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Make space for what matters.
            </h1>
            <p className="mt-2 text-sm text-black/48">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {` · ${plannedMinutes} minutes planned`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              <button
                onClick={() => moveDate(-1)}
                aria-label="Previous day"
                className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.07] bg-white/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="rounded-lg border border-black/[0.07] bg-white/70 px-4 py-2 text-sm font-medium"
              >
                Today
              </button>
              <button
                onClick={() => moveDate(1)}
                aria-label="Next day"
                className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.07] bg-white/70"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void autoSchedule("day")}
                disabled={scheduling !== null}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#f4c85b] px-3 py-2 text-xs font-semibold text-[#4b3b18] disabled:opacity-50"
              >
                {scheduling === "day" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Schedule day
              </button>
              <button
                onClick={() => void autoSchedule("week")}
                disabled={scheduling !== null}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#708354] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {scheduling === "week" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CalendarDays className="h-3.5 w-3.5" />
                )}
                Schedule week
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-[420px] place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#d0902f]" />
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-black/[0.065] bg-[#fbfaf7] p-5 shadow-sm">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-semibold">Plan this week</h2>
                  <p className="mt-1 text-xs text-black/42">
                    {weekStart.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    –{" "}
                    {new Date(weekEnd.getTime() - 1).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )}
                    . Pick weekly tasks, then add the ones you want to a day.
                  </p>
                </div>
                <span className="text-xs font-medium text-[#65764d]">
                  {weekTasks.length} task{weekTasks.length === 1 ? "" : "s"}{" "}
                  this week
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-[#eef3e3] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40">
                    This week
                  </p>
                  {weekTasks.length === 0 && (
                    <p className="py-3 text-xs text-black/40">
                      No weekly tasks yet. Choose some from your backlog.
                    </p>
                  )}
                  <div className="grid gap-1 sm:grid-cols-2">
                    {weekTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex min-w-0 rounded-lg bg-white/75 hover:bg-white"
                      >
                        <button
                          disabled={isSameLocalDay(
                            task.startDate,
                            selectedDate
                          )}
                          onClick={() =>
                            updateTask(task.id, {
                              startDate: new Date(
                                `${selectedKey}T00:00:00`
                              ).toISOString(),
                              plannedWeekStart: `${weekStartKey}T00:00:00.000Z`,
                            })
                          }
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs disabled:opacity-55"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0 text-[#d0902f]" />
                          <span className="min-w-0 flex-1 truncate">
                            {task.title}
                          </span>
                          <span className="shrink-0 text-black/35">
                            {isSameLocalDay(task.startDate, selectedDate)
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
                          className="grid w-8 shrink-0 place-items-center rounded-r-lg text-black/25 hover:bg-black/[0.04] hover:text-black/55"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-[#fff4d5] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40">
                    Backlog
                  </p>
                  {backlogTasks.length === 0 && (
                    <p className="py-3 text-xs text-black/40">
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
                        className="flex min-w-0 items-center gap-2 rounded-lg bg-white/75 px-3 py-2 text-left text-xs hover:bg-white"
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0 text-[#7b8e5d]" />
                        <span className="min-w-0 flex-1 truncate">
                          {task.title}
                        </span>
                        <span className="shrink-0 text-black/35">
                          Add to week
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(430px,1.25fr)_minmax(280px,0.7fr)]">
              <section className="overflow-hidden rounded-2xl border border-black/[0.065] bg-[#fbfaf7] shadow-sm">
                <div className="border-b border-black/[0.055] p-5">
                  <h2 className="font-semibold">Today&apos;s list</h2>
                  <p className="mt-1 text-xs text-black/42">
                    Real tasks saved to your account.
                  </p>
                  <form onSubmit={createTask} className="mt-4 flex gap-2">
                    <input
                      value={newTaskTitle}
                      onChange={(event) => setNewTaskTitle(event.target.value)}
                      placeholder="Add a task for today"
                      className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#d0902f]"
                    />
                    <button
                      disabled={saving || !newTaskTitle.trim()}
                      className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9ae43] text-[#493916] shadow-[0_3px_0_#c88d2b] disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                <div className="space-y-2 p-3">
                  {todayTasks.length === 0 && (
                    <p className="p-5 text-center text-sm text-black/40">
                      Your day is open. Add a task or choose one from this week.
                    </p>
                  )}
                  {todayTasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-xl border border-black/[0.055] bg-white p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() =>
                            updateTask(task.id, {
                              status:
                                task.status === "completed"
                                  ? "todo"
                                  : "completed",
                            })
                          }
                          className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${task.status === "completed" ? "border-[#84a75e] bg-[#84a75e] text-white" : "border-black/20"}`}
                        >
                          {task.status === "completed" && (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium ${task.status === "completed" ? "text-black/35 line-through" : ""}`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-black/40">
                            <Clock3 className="h-3 w-3" />
                            {task.duration ?? 30}m
                            {task.project?.name && ` · ${task.project.name}`}
                            <label className="ml-auto flex items-center gap-1.5 text-black/45">
                              Time
                              <input
                                type="time"
                                aria-label={`Schedule ${task.title}`}
                                defaultValue={
                                  task.scheduledStart &&
                                  isSameLocalDay(
                                    task.scheduledStart,
                                    selectedDate
                                  )
                                    ? `${String(new Date(task.scheduledStart).getHours()).padStart(2, "0")}:${String(new Date(task.scheduledStart).getMinutes()).padStart(2, "0")}`
                                    : ""
                                }
                                onChange={(event) =>
                                  void scheduleTask(task, event.target.value)
                                }
                                className="rounded-md border border-black/10 bg-[#f8f6f1] px-1.5 py-1 text-[10px] text-black/65"
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
                              className="text-[10px] text-black/35 underline-offset-2 hover:text-black/60 hover:underline"
                            >
                              Remove from day
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="border-t border-black/[0.055] p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">
                    Available this week
                  </p>
                  {weekTasks.filter(
                    (task) => !isSameLocalDay(task.startDate, selectedDate)
                  ).length === 0 && (
                    <p className="py-3 text-xs text-black/35">
                      No other weekly tasks waiting.
                    </p>
                  )}
                  {weekTasks
                    .filter(
                      (task) => !isSameLocalDay(task.startDate, selectedDate)
                    )
                    .slice(0, 8)
                    .map((task) => (
                      <button
                        key={task.id}
                        onClick={() =>
                          updateTask(task.id, {
                            startDate: new Date(
                              `${selectedKey}T00:00:00`
                            ).toISOString(),
                          })
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-black/[0.035]"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#d0902f]" />
                        <span className="flex-1 truncate">{task.title}</span>
                        <span className="text-black/30">Add to day</span>
                      </button>
                    ))}
                </div>
              </section>

              <section className="rounded-2xl border border-black/[0.065] bg-[#fbfaf7] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-black/45" />
                  <h2 className="text-sm font-semibold">
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
                      color: event.feed?.color ?? "#d9cdf2",
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
                        color: "#ffd8ca",
                      })),
                    ...friendBlocks.map((block) => ({
                      id: `friend-${block.id}`,
                      title: block.title,
                      start: block.start,
                      end: block.end,
                      type: `${block.owner} · ${block.source === "focus" ? "Focus block" : "Calendar"}`,
                      color: block.color,
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
                        className="flex items-center gap-3 rounded-xl border border-black/[0.055] bg-white p-3"
                      >
                        <span
                          className="h-10 w-1 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-black/40">
                            {formatTime(item.start)} – {formatTime(item.end)} ·{" "}
                            {item.type}
                          </p>
                        </div>
                      </article>
                    ))}
                  {dayEvents.length === 0 &&
                    friendBlocks.length === 0 &&
                    !todayTasks.some((task) => task.scheduledStart) && (
                      <div className="grid min-h-[280px] place-items-center rounded-xl border border-dashed border-black/10 text-center">
                        <div>
                          <CalendarDays className="mx-auto h-6 w-6 text-black/20" />
                          <p className="mt-2 text-sm text-black/40">
                            Your events, focus blocks, and friends&apos; shared
                            time will appear here.
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </section>

              <aside className="space-y-5">
                <section className="rounded-2xl bg-[#5f7048] p-5 text-[#fffbea] shadow-[0_8px_0_#465535]">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/65">
                    <Sparkles className="h-3.5 w-3.5 text-[#f4c85b]" />
                    Daily intention
                  </div>
                  <textarea
                    value={intention}
                    onChange={(event) => setIntention(event.target.value)}
                    placeholder="What would make today meaningful?"
                    rows={5}
                    className="mt-4 w-full resize-none rounded-xl border border-white/15 bg-white/[0.08] p-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/40 focus:border-[#f4c85b]"
                  />
                  <button
                    onClick={() => savePlan()}
                    disabled={saving}
                    className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#f8dc8a] disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save intention
                  </button>
                </section>
                <button
                  onClick={() => savePlan(!plan?.completedAt)}
                  disabled={saving}
                  className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition ${plan?.completedAt ? "bg-[#84a75e] text-white" : "bg-[#f4c85b] text-[#4b3b18] hover:bg-[#edbb45]"}`}
                >
                  <span>
                    <span className="block text-sm font-semibold">
                      {plan?.completedAt
                        ? "Your day is planned"
                        : "Finish planning"}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-white/70">
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
      </div>
    </div>
  );
}
