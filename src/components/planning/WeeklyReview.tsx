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
  Sparkles,
} from "lucide-react";

import { WeekPicker } from "@/components/planning/WeekPicker";
import { WeekRangeSelect } from "@/components/planning/WeekRangeSelect";
import { SunnieDeleteDialog } from "@/components/ui/sunnie-delete-dialog";

import { localDateKey } from "@/lib/daily-intention";
import { WEEKLY_REVIEW_TOUR_STEP_EVENT } from "@/lib/onboarding";
import { shiftWeek, weekKey, weekRangeLabel } from "@/lib/planning-week";
import { cn } from "@/lib/utils";

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
  "rounded-xl border border-[#dce3c9] bg-[#fffdf5] px-3 py-2 text-sm font-medium disabled:opacity-50";
const field =
  "mt-2 w-full min-w-0 rounded-xl border border-[#dce3c9] bg-[#fffdf5] p-3 text-sm outline-none focus:ring-2 focus:ring-[#b6c994]";
const steps = ["Look back", "Reflect", "Unfinished tasks", "Next week"];
async function json<T>(response: Response): Promise<T> {
  if (!response.ok)
    throw new Error(
      "Sunnie couldn’t save or load this change. Please try again."
    );
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
  const [week, setWeek] = useState(
    preview?.week ?? shiftWeek(weekKey(localDateKey(new Date())), -1)
  );
  const [data, setData] = useState<WeeklyReviewData | null>(preview ?? null);
  const [step, setStep] = useState(0);
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
        setStep(nextStep);
      }
    };
    window.addEventListener(WEEKLY_REVIEW_TOUR_STEP_EVENT, showTourStep);
    return () =>
      window.removeEventListener(WEEKLY_REVIEW_TOUR_STEP_EVENT, showTourStep);
  }, []);

  function edit(updates: Partial<Review>) {
    setDraft((current) =>
      current ? { ...current, ...updates, completedAt: null } : current
    );
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
      setJustFinished(completed);
      return true;
    } catch (caught) {
      setError((caught as Error).message);
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
    setStep(0);
    setMessage("");
    setJustFinished(false);
  }
  async function updateTask(task: ReviewTask, plannedWeekStart: string | null) {
    setBusy(true);
    setError("");
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
      setData((current) =>
        current
          ? {
              ...current,
              unfinished: current.unfinished.filter((t) => t.id !== task.id),
            }
          : current
      );
      setMessage(
        plannedWeekStart
          ? `“${task.title}” is planned for the week of ${plannedWeekStart}.`
          : `“${task.title}” is back in Backlog.`
      );
    } catch (caught) {
      setError((caught as Error).message);
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
  return (
    <section
      id="weekly-review"
      className="relative mt-8 min-w-0 scroll-mt-6 overflow-hidden rounded-[2rem] border border-[#dce3c9] bg-gradient-to-br from-[#fffdf7] via-white/90 to-[#eef4df] p-4 text-[#3f432e] shadow-[0_18px_50px_rgba(101,118,77,0.09)] sm:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#f8d77c]/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#b9d4ad]/20 blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#718e50]">
            <BookOpen className="h-4 w-4" /> History & reflection
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Your weekly review</h2>
          <p className="mt-1 text-sm text-black/55">
            Look back kindly, then make room for what’s next.
          </p>
        </div>
        <div className="flex w-full max-w-full items-center gap-1 rounded-2xl border border-white/80 bg-white/65 p-1.5 shadow-sm backdrop-blur-sm sm:w-[400px] sm:gap-2">
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
      <p className="relative mt-3 text-xs text-black/50">
        Sunday–Saturday · {weekRangeLabel(week)} · Reflections stay private to
        your account.
      </p>
      {draft?.completedAt && (
        <div
          role="status"
          className="relative mt-4 flex items-center gap-3 rounded-2xl border border-[#c8d8aa] bg-[#edf4df] px-4 py-3 text-sm text-[#52683d] shadow-sm"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#7f9b5d] text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold">
              {justFinished ? "Week wrapped up!" : "Review finished"}
            </span>
            <span className="text-xs text-black/50">
              Your reflection is saved. Editing anything will reopen it.
            </span>
          </span>
        </div>
      )}
      <div className="relative my-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f4f5e9]/80 p-1.5 lg:grid-cols-4">
        {steps.map((label, index) => (
          <button
            key={label}
            disabled={busy || loading}
            onClick={() => setStep(index)}
            aria-current={step === index ? "step" : undefined}
            className={cn(
              button,
              "flex items-center gap-2 border-transparent bg-transparent text-left shadow-none transition-colors",
              step === index && "border-white bg-white text-[#52683d] shadow-sm"
            )}
          >
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/80 text-xs",
                step === index && "bg-[#f4c85b] text-[#4b452b]"
              )}
            >
              {index + 1}
            </span>
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="my-3 rounded-xl bg-[#fff0e7] p-3 text-sm text-[#984c36]"
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
        <p role="status" className="my-3 rounded-xl bg-[#edf3df] p-3 text-sm">
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
            {step === 0 && (
              <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                <div className="min-w-0 rounded-2xl bg-[#f3f6e9] p-4">
                  <h3 className="font-semibold">Completed tasks</h3>
                  <p className="mt-1 text-xs text-black/50">
                    Grouped by when you finished them.
                  </p>
                  {!data.completed.length && (
                    <p className="py-5 text-sm text-black/55">
                      No completed tasks recorded this week. Your week still
                      mattered.
                    </p>
                  )}
                  <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                    {data.completed.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-start gap-2 rounded-xl bg-white/80 p-3 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#718e50]" />
                        <div className="min-w-0 flex-1">
                          <p className="break-words">{task.title}</p>
                          <p className="mt-1 text-xs text-black/50">
                            {task.completedAt && displayDate(task.completedAt)}
                          </p>
                        </div>
                        <button
                          disabled={busy}
                          className="shrink-0 text-xs underline"
                          onClick={async () => {
                            setBusy(true);
                            setError("");
                            try {
                              if (!preview)
                                await fetch(`/api/tasks/${task.id}`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ status: "todo" }),
                                }).then(json);
                              setData({
                                ...data,
                                completed: data.completed.filter(
                                  (t) => t.id !== task.id
                                ),
                              });
                              onTasksChanged?.();
                              setMessage(
                                "Task reopened. You can find it in Tasks."
                              );
                            } catch (caught) {
                              setError((caught as Error).message);
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
                <div className="min-w-0 rounded-2xl bg-[#fff4db] p-4">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <CalendarDays className="h-4 w-4 text-[#b57a45]" /> Calendar
                    moments
                  </h3>
                  <p className="mt-1 text-xs text-black/55">
                    A read-only glance at where your time was planned. Use it as
                    a memory cue while you reflect—it is not an attendance log.
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
                            className="accent-[#718e50]"
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
                          className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/75 p-3 text-sm shadow-[0_4px_14px_rgba(126,105,65,0.05)]"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white"
                            style={{
                              backgroundColor: calendar?.color ?? "#d9a66f",
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block break-words">
                              {event.title}
                            </span>
                            <span className="mt-1 block text-xs text-black/50">
                              {displayDate(event.start)} ·{" "}
                              {event.allDay
                                ? "All day"
                                : `${Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000)} min scheduled`}
                            </span>
                            {calendar && (
                              <span className="mt-1 block text-[11px] text-black/40">
                                {calendar.name}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {!visibleEvents.length && (
                    <p className="py-4 text-sm text-black/55">
                      No past events from the selected calendars.
                    </p>
                  )}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-5 lg:grid-cols-2">
                {(
                  [
                    ["goodThings", "What felt good?"],
                    ["makeEasier", "What would make next week easier?"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-sm font-medium">
                    {label}
                    <span className="ml-2 text-xs font-normal text-black/45">
                      Optional
                    </span>
                    <textarea
                      maxLength={5000}
                      rows={6}
                      className={field}
                      value={draft[key]}
                      disabled={busy}
                      onChange={(e) => edit({ [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            )}
            {step === 2 && (
              <div>
                <p className="mb-4 text-sm text-black/55">
                  These tasks were planned, dated, or scheduled in this week and
                  are still open. Sunnie carries older weekly tasks forward
                  automatically; choose what should happen next. Deadlines and
                  locked times stay as they are.
                </p>
                <div className="grid gap-3 lg:grid-cols-2">
                  {data.unfinished.map((task) => (
                    <UnfinishedTask
                      key={task.id}
                      task={task}
                      currentWeek={data.currentWeek}
                      disabled={busy}
                      onMove={(value) => void updateTask(task, value)}
                      onDelete={() => setDeleting(task)}
                    />
                  ))}
                </div>
                {!data.unfinished.length && (
                  <div className="rounded-2xl bg-[#eef3e3] px-4 py-6 text-center text-sm">
                    <Sparkles className="mx-auto mb-2 h-5 w-5 text-[#718e50]" />
                    Nothing from this week is waiting for a decision.
                  </div>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="max-w-2xl">
                <Leaf className="mb-3 h-7 w-7 text-[#718e50]" />
                <label className="text-sm font-medium">
                  A few priorities for next week{" "}
                  <span className="text-xs font-normal text-black/45">
                    Optional
                  </span>
                  <textarea
                    rows={4}
                    maxLength={5000}
                    value={draft.nextPriorities}
                    disabled={busy}
                    onChange={(e) => edit({ nextPriorities: e.target.value })}
                    className={field}
                    placeholder="What would you like to make space for?"
                  />
                </label>
                <p className="mt-2 text-xs text-black/50">
                  Saved as a note, so you can revisit it without creating more
                  tasks.
                </p>
                <Link
                  className="mt-4 inline-block text-sm font-medium underline"
                  href="/tasks"
                  onClick={async (event) => {
                    if (!dirty) return;
                    event.preventDefault();
                    if (await save(false)) router.push("/tasks");
                  }}
                >
                  Choose tasks for next week in Tasks
                </Link>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e6d5] pt-4">
              <p className="text-xs text-black/50">
                {dirty
                  ? "Unsaved changes"
                  : draft.completedAt
                    ? "Review completed and saved"
                    : "Reflection is optional"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={button}
                  disabled={busy}
                  onClick={() => void save(false)}
                >
                  {busy ? "Saving…" : "Save reflection"}
                </button>
                {step < 3 ? (
                  <button
                    className={cn(button, "bg-[#f4c85b]")}
                    disabled={busy}
                    onClick={() => setStep(step + 1)}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cn(button, "bg-[#eaf0d9]")}
                    disabled={busy || !!draft.completedAt}
                    onClick={() => void save(true)}
                  >
                    {draft.completedAt ? "Review finished ✓" : "Finish review"}
                  </button>
                )}
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
  currentWeek,
  disabled,
  onMove,
  onDelete,
}: {
  task: ReviewTask;
  currentWeek: string;
  disabled: boolean;
  onMove: (week: string | null) => void;
  onDelete: () => void;
}) {
  const [choice, setChoice] = useState(
    task.plannedWeekStart?.slice(0, 10) ?? ""
  );
  return (
    <div className="min-w-0 rounded-2xl border border-[#e3e6d5] p-4">
      <h4 className="break-words font-medium">{task.title}</h4>
      {task.rolloverCount >= 3 && (
        <p className="mt-2 rounded-lg bg-[#fff4db] p-2 text-xs">
          Carried forward {task.rolloverCount} weeks. Still something you want
          to make space for?
        </p>
      )}
      {task.scheduleLocked && (
        <p className="mt-2 text-xs text-black/50">
          Calendar placement is locked. Changing the week won’t move it.
        </p>
      )}
      <div className="mt-3">
        <WeekPicker value={choice} onChange={setChoice} disabled={disabled} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={button}
          disabled={disabled}
          onClick={() => onMove(choice || null)}
        >
          Apply week
        </button>
        <button
          className={button}
          disabled={disabled}
          onClick={() => onMove(currentWeek)}
        >
          Keep this week
        </button>
        <button
          className={button}
          disabled={disabled}
          onClick={() => onMove(null)}
        >
          Backlog
        </button>
        <button
          className={`${button} text-[#984c36]`}
          disabled={disabled}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
