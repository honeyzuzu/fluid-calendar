"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { toast } from "sonner";

import { WeekPicker } from "@/components/planning/WeekPicker";
import { WeekRangeSelect } from "@/components/planning/WeekRangeSelect";
import { SunnieDeleteDialog } from "@/components/ui/sunnie-delete-dialog";

import { getColorTheme, resolveThemeLinkedColor } from "@/lib/color-themes";
import { localDateKey } from "@/lib/daily-intention";
import { WEEKLY_REVIEW_TOUR_STEP_EVENT } from "@/lib/onboarding";
import { shiftWeek, weekKey, weekRangeLabel } from "@/lib/planning-week";
import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/store/settings";

type ReviewTask = {
  id: string;
  title: string;
  completedAt: string | null;
  duration: number | null;
  plannedWeekStart: string | null;
  rolloverCount: number;
  scheduleLocked: boolean;
};
type Review = {
  goodThings: string;
  makeEasier: string;
  nextPriorities: string;
  calendarIds: string[];
  completedAt: string | null;
};
export type WeeklyReviewData = {
  week: string;
  currentWeek: string;
  timeZone: string;
  review: Review | null;
  completed: ReviewTask[];
  nextCursor: string | null;
  unfinished: ReviewTask[];
  calendars: {
    id: string;
    name: string;
    enabled: boolean;
    color: string | null;
    colorSlot: string | null;
  }[];
  events: {
    id: string;
    feedId: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
  }[];
};
const button =
  "rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium disabled:opacity-50";
const field =
  "mt-2 w-full min-w-0 rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring";
async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error ||
        "Sunnie couldn’t save or load this change. Please try again."
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export function WeeklyReview({
  preview,
  onTasksChanged,
}: {
  preview?: WeeklyReviewData;
  onTasksChanged?: () => void;
}) {
  const router = useRouter();
  const colorTheme = getColorTheme(
    useSettingsStore((state) => state.user.colorTheme)
  );
  const [week, setWeek] = useState(
    preview?.week ?? shiftWeek(weekKey(localDateKey(new Date())), -1)
  );
  const [data, setData] = useState<WeeklyReviewData | null>(preview ?? null);
  const [draft, setDraft] = useState<Review | null>(preview?.review ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [justFinished, setJustFinished] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState<ReviewTask | null>(null);
  const [loading, setLoading] = useState(!preview);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (preview) return;
      setLoading(true);
      setError("");
      try {
        const result = await fetch(`/api/weekly-review?week=${week}`, {
          signal,
          cache: "no-store",
        }).then(json<WeeklyReviewData>);
        if (signal?.aborted) return;
        setData(result);
        setDraft(
          result.review
            ? {
                ...result.review,
                calendarIds: result.review.calendarIds.filter((id) =>
                  result.calendars.some((calendar) => calendar.id === id)
                ),
              }
            : {
                goodThings: "",
                makeEasier: "",
                nextPriorities: "",
                calendarIds: result.calendars
                  .filter((c) => c.enabled)
                  .map((c) => c.id),
                completedAt: null,
              }
        );
        setDirty(false);
      } catch (caught) {
        if (!signal?.aborted)
          setError(
            caught instanceof Error ? caught.message : "Unable to load review"
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [week, preview]
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    const showTourStep = (event: Event) => {
      const nextStep = (event as CustomEvent<{ step?: number }>).detail?.step;
      if (typeof nextStep === "number" && nextStep >= 0 && nextStep < 4) {
        document
          .getElementById(
            [
              "review-look-back",
              "review-reflect",
              "review-unfinished",
              "review-next-week",
            ][nextStep]
          )
          ?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    };
    window.addEventListener(WEEKLY_REVIEW_TOUR_STEP_EVENT, showTourStep);
    return () =>
      window.removeEventListener(WEEKLY_REVIEW_TOUR_STEP_EVENT, showTourStep);
  }, []);

  function edit(updates: Partial<Review>) {
    setDraft((current) => (current ? { ...current, ...updates } : current));
    setDirty(true);
    setJustFinished(false);
    setMessage("");
  }
  async function save(completed: boolean) {
    if (!draft) return false;
    setBusy(true);
    setError("");
    try {
      const saved = preview
        ? { ...draft, completedAt: completed ? new Date().toISOString() : null }
        : await fetch("/api/weekly-review", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...draft, week, completed }),
          }).then(json<Review>);
      setDraft(saved);
      setDirty(false);
      setMessage(
        completed
          ? "Your weekly review is saved. A little space for a fresh start."
          : "Reflection saved privately to your account."
      );
      toast.success(completed ? "Review finished" : "Draft saved");
      setJustFinished(completed);
      return true;
    } catch (caught) {
      setError((caught as Error).message);
      toast.error("Could not save review", {
        description: (caught as Error).message,
      });
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function changeWeek(next: string) {
    if (next === week) return;
    if (dirty && !(await save(false))) return;
    setData(null);
    setDraft(null);
    setWeek(next);
    setMessage("");
    setJustFinished(false);
  }
  async function updateTask(task: ReviewTask, plannedWeekStart: string | null) {
    setBusy(true);
    setError("");
    const previous = data;
    setData((current) =>
      current
        ? {
            ...current,
            unfinished: current.unfinished.filter(
              (item) => item.id !== task.id
            ),
          }
        : current
    );
    try {
      if (!preview)
        await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plannedWeekStart,
            acknowledgeRollover: true,
            ...(plannedWeekStart === null ? { startDate: null } : {}),
          }),
        }).then(json);
      onTasksChanged?.();
      setMessage(
        plannedWeekStart
          ? `“${task.title}” is planned for the week of ${plannedWeekStart}.`
          : `“${task.title}” is back in Backlog.`
      );
      toast.success(
        plannedWeekStart
          ? "Task moved to the selected week"
          : "Task moved to Backlog"
      );
    } catch (caught) {
      setData(previous);
      const feedback = `${(caught as Error).message} The task is still here; try again.`;
      setError(feedback);
      toast.error("Task choice was not saved", { description: feedback });
    } finally {
      setBusy(false);
    }
  }
  const displayDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      timeZone: data?.timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  const visibleEvents =
    data?.events.filter((event) => draft?.calendarIds.includes(event.feedId)) ??
    [];
  const calendarsById = new Map(
    data?.calendars.map((calendar) => [calendar.id, calendar]) ?? []
  );
  const isFinished = !!draft?.completedAt && !dirty;
  return (
    <section
      id="weekly-review"
      className="relative min-w-0 scroll-mt-6 overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card/90 to-muted p-4 text-foreground shadow-[var(--shadow-raised)] sm:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[var(--sunnie-warm-glow)] opacity-25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[var(--sunnie-cool-glow)] opacity-20 blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <BookOpen className="h-4 w-4" /> History & reflection
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Your weekly review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Look back kindly, then make room for what’s next.
          </p>
        </div>
        <div className="flex w-full max-w-full items-center gap-1 rounded-2xl border border-border bg-card/65 p-1.5 shadow-sm backdrop-blur-sm sm:w-[400px] sm:gap-2">
          <button
            className={button}
            aria-label="Previous review week"
            disabled={busy || loading || !!preview}
            onClick={() => void changeWeek(shiftWeek(week, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <WeekRangeSelect
            className="min-w-0 flex-1 border-0 bg-transparent"
            ariaLabel="Choose review week"
            value={week}
            disabled={busy || !!preview}
            onChange={(value) => void changeWeek(value)}
          />
          <button
            className={button}
            aria-label="Next review week"
            disabled={busy || loading || !!preview}
            onClick={() => void changeWeek(shiftWeek(week, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="relative mt-3 text-xs text-muted-foreground">
        Sunday–Saturday · {weekRangeLabel(week)} · Reflections stay private to
        your account.
      </p>
      {isFinished && (
        <div
          role="status"
          className="relative mt-4 flex items-center gap-3 rounded-2xl border border-success/35 bg-success/10 px-4 py-3 text-sm text-secondary-foreground shadow-sm"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold">
              {justFinished ? "Week wrapped up!" : "Review finished"}
            </span>
            <span className="text-xs text-muted-foreground">
              Your reflection is saved. You can revisit or edit it anytime.
            </span>
          </span>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="my-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}{" "}
          {!dirty && (
            <button className="underline" onClick={() => void load()}>
              Reload
            </button>
          )}
        </p>
      )}
      {message && (
        <p role="status" className="my-3 rounded-xl bg-success/10 p-3 text-sm">
          {message}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-8 text-sm">
          Gathering your week…
        </p>
      ) : (
        data &&
        draft && (
          <>
            <section
              id="review-look-back"
              className="scroll-mt-6 border-t border-border pt-5"
            >
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">A look at your week</h3>
                <p className="text-xs text-muted-foreground">
                  {data.completed.length} completed · {data.unfinished.length}{" "}
                  unfinished
                </p>
              </div>
              <div
                className={cn(
                  "grid min-w-0 gap-4",
                  data.calendars.length && "lg:grid-cols-2"
                )}
              >
                <div className="min-w-0 rounded-2xl bg-muted/60 p-4">
                  <h3 className="font-semibold">Completed tasks</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Grouped by when you finished them.
                  </p>
                  {!data.completed.length && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No completed tasks recorded. You can still reflect on this
                      week.
                    </p>
                  )}
                  <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                    {data.completed.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-start gap-2 rounded-xl bg-card/80 p-3 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="break-words">{task.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.completedAt && displayDate(task.completedAt)}
                          </p>
                        </div>
                        <button
                          disabled={busy}
                          className="shrink-0 text-xs underline"
                          onClick={async () => {
                            setBusy(true);
                            setError("");
                            const previous = data;
                            setData((current) =>
                              current
                                ? {
                                    ...current,
                                    completed: current.completed.filter(
                                      (item) => item.id !== task.id
                                    ),
                                  }
                                : current
                            );
                            try {
                              if (!preview)
                                await fetch(`/api/tasks/${task.id}`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ status: "todo" }),
                                }).then(json);
                              onTasksChanged?.();
                              setMessage(
                                "Task reopened. You can find it in Tasks."
                              );
                              toast.success("Task reopened");
                            } catch (caught) {
                              setData(previous);
                              const feedback = `${(caught as Error).message} The completed task was restored; try again.`;
                              setError(feedback);
                              toast.error("Task could not be reopened", {
                                description: feedback,
                              });
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Undo
                        </button>
                      </li>
                    ))}
                  </ul>
                  {data.nextCursor && (
                    <button
                      className={`${button} mt-3`}
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const page = await fetch(
                            `/api/weekly-review?week=${week}&cursor=${encodeURIComponent(data.nextCursor!)}`
                          ).then(json<WeeklyReviewData>);
                          setData({
                            ...data,
                            completed: [...data.completed, ...page.completed],
                            nextCursor: page.nextCursor,
                          });
                        } catch (caught) {
                          setError((caught as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Load more completions
                    </button>
                  )}
                </div>
                {data.calendars.length > 0 && (
                  <div className="min-w-0 rounded-2xl bg-accent/30 p-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <CalendarDays className="h-4 w-4 text-primary" /> Calendar
                      moments
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A read-only glance at where your time was planned. Use it
                      as a memory cue while you reflect—it is not an attendance
                      log.
                    </p>
                    <details className="my-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        Choose calendars ({draft.calendarIds.length})
                      </summary>
                      <div className="mt-2 space-y-2">
                        {data.calendars.map((calendar) => (
                          <label
                            key={calendar.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="accent-primary"
                              disabled={busy}
                              checked={draft.calendarIds.includes(calendar.id)}
                              onChange={(e) =>
                                edit({
                                  calendarIds: e.target.checked
                                    ? [...draft.calendarIds, calendar.id]
                                    : draft.calendarIds.filter(
                                        (id) => id !== calendar.id
                                      ),
                                })
                              }
                            />
                            <span className="break-words">{calendar.name}</span>
                          </label>
                        ))}
                      </div>
                    </details>
                    <ul className="max-h-96 space-y-2 overflow-y-auto">
                      {visibleEvents.map((event) => {
                        const calendar = calendarsById.get(event.feedId);
                        return (
                          <li
                            key={event.id}
                            className="flex items-start gap-3 rounded-xl border border-border bg-card/75 p-3 text-sm shadow-[var(--shadow-paper)]"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white"
                              style={{
                                backgroundColor: resolveThemeLinkedColor(
                                  "events",
                                  calendar?.colorSlot,
                                  calendar?.color,
                                  colorTheme.id
                                ),
                              }}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block break-words">
                                {event.title}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {displayDate(event.start)} ·{" "}
                                {event.allDay
                                  ? "All day"
                                  : `${Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000)} min scheduled`}
                              </span>
                              {calendar && (
                                <span className="mt-1 block text-[11px] text-muted-foreground">
                                  {calendar.name}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {!visibleEvents.length && (
                      <p className="py-4 text-sm text-muted-foreground">
                        No past events from the selected calendars.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
            <section
              id="review-reflect"
              className="scroll-mt-6 mt-6 border-t border-border pt-5"
            >
              <h3 className="mb-1 text-lg font-semibold">
                What would you like to remember?
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                A few words are enough. Your notes stay private.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {(
                  [
                    ["goodThings", "What felt good?"],
                    ["makeEasier", "What would make next week easier?"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm font-medium">
                    <span className="block">{label}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Optional reflection
                    </span>
                    <textarea
                      aria-label={label}
                      maxLength={5000}
                      rows={4}
                      className={field}
                      value={draft[key]}
                      disabled={busy}
                      onChange={(e) => edit({ [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            </section>
            {data.unfinished.length > 0 && (
              <section
                id="review-unfinished"
                className="scroll-mt-6 mt-6 border-t border-border pt-5"
              >
                <h3 className="text-lg font-semibold">Unfinished tasks</h3>
                <div>
                  <p className="mb-4 mt-1 text-sm text-muted-foreground">
                    Choose what to carry forward. Deadlines and locked calendar
                    times stay as they are.
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {data.unfinished.map((task) => (
                      <UnfinishedTask
                        key={task.id}
                        task={task}
                        disabled={busy}
                        onMove={(value) => void updateTask(task, value)}
                        onDelete={() => setDeleting(task)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}
            <section
              id="review-next-week"
              className="scroll-mt-6 mt-6 border-t border-border pt-5"
            >
              <div className="max-w-2xl">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Leaf className="h-5 w-5 text-primary" /> A gentle start for
                  next week
                </h3>
                <label className="mt-4 block text-sm font-medium">
                  <span className="block">A few priorities for next week</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Optional note
                  </span>
                  <textarea
                    aria-label="A few priorities for next week"
                    rows={4}
                    maxLength={5000}
                    value={draft.nextPriorities}
                    disabled={busy}
                    onChange={(e) => edit({ nextPriorities: e.target.value })}
                    className={field}
                    placeholder="What would you like to make space for?"
                  />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">
                  Saved as a note, so you can revisit it without creating more
                  tasks.
                </p>
                <Link
                  className="mt-4 inline-block text-sm font-medium underline"
                  href="/upcoming"
                  onClick={async (event) => {
                    if (!dirty) return;
                    event.preventDefault();
                    if (await save(false)) router.push("/upcoming");
                  }}
                >
                  Plan next week in Upcoming
                </Link>
              </div>
            </section>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                {dirty
                  ? "Unsaved changes"
                  : draft.completedAt
                    ? "Review completed and saved"
                    : "Your review is ready when you are"}
              </p>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <button
                  type="button"
                  className={button}
                  disabled={busy || isFinished}
                  onClick={() => void save(false)}
                >
                  {busy ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  className={cn(
                    button,
                    "bg-accent text-accent-foreground sm:min-w-36"
                  )}
                  disabled={busy || isFinished}
                  onClick={() => void save(true)}
                >
                  {isFinished ? "Review finished ✓" : "Finish review"}
                </button>
              </div>
            </div>
          </>
        )
      )}
      <SunnieDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        itemType="task"
        itemName={deleting?.title}
        onConfirm={async () => {
          if (!deleting) return;
          if (!preview)
            await fetch(`/api/tasks/${deleting.id}`, { method: "DELETE" }).then(
              json
            );
          setData((current) =>
            current
              ? {
                  ...current,
                  unfinished: current.unfinished.filter(
                    (task) => task.id !== deleting.id
                  ),
                }
              : current
          );
          onTasksChanged?.();
        }}
      />
    </section>
  );
}

function UnfinishedTask({
  task,
  disabled,
  onMove,
  onDelete,
}: {
  task: ReviewTask;
  disabled: boolean;
  onMove: (week: string | null) => void;
  onDelete: () => void;
}) {
  const [choice, setChoice] = useState(
    task.plannedWeekStart?.slice(0, 10) ?? ""
  );
  return (
    <div className="min-w-0 rounded-2xl border border-border p-4">
      <h4 className="break-words font-medium">{task.title}</h4>
      {task.rolloverCount >= 3 && (
        <p className="mt-2 rounded-lg bg-accent/55 p-2 text-xs">
          Carried forward {task.rolloverCount} weeks. Still something you want
          to make space for?
        </p>
      )}
      {task.scheduleLocked && (
        <p className="mt-2 text-xs text-muted-foreground">
          Calendar placement is locked. Changing the week won’t move it.
        </p>
      )}
      <div className="mt-3">
        <WeekPicker value={choice} onChange={setChoice} disabled={disabled} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className={cn(button, "bg-accent text-accent-foreground")}
          disabled={disabled}
          onClick={() => onMove(choice || null)}
        >
          {choice ? "Move to selected week" : "Move to Backlog"}
        </button>
        <button
          className="px-3 py-2 text-sm text-destructive underline underline-offset-2 disabled:opacity-50"
          disabled={disabled}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
