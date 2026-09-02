"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Inbox,
  Loader2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { needsTaskTuneUp, parseBrainDump } from "@/lib/brain-dump";
import { cn } from "@/lib/utils";

import { EnergyLevel, Priority, TaskStatus } from "@/types/task";

const DRAFT_STORAGE_KEY = "sunnie-brain-dump-draft";
const selectClassName =
  "h-12 w-full rounded-xl border border-[#dce3c9] bg-[#fffdf5] px-3 text-sm font-medium text-[#3f432e] outline-none focus:border-[#91a96d] focus:ring-4 focus:ring-[#dfe9ca]/50";

type View = "dump" | "tune-up";
type TunableTask = {
  id: string;
  title: string;
  status: TaskStatus;
  duration: number | null;
  priority: Priority | null;
  energyLevel: EnergyLevel | null;
  dueDate: string | null;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return body as T;
}

export default function BrainDumpPage() {
  const [view, setView] = useState<View>("dump");
  const [draft, setDraft] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [savingDump, setSavingDump] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [tasks, setTasks] = useState<TunableTask[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [duration, setDuration] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | "">("");
  const [dueDate, setDueDate] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const parsedTasks = useMemo(() => parseBrainDump(draft), [draft]);
  const tuneUpTasks = useMemo(() => tasks.filter(needsTaskTuneUp), [tasks]);
  const currentTask = tuneUpTasks[currentIndex] ?? null;

  useEffect(() => {
    setDraft(window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? "");
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem(DRAFT_STORAGE_KEY, draft);
  }, [draft, draftReady]);

  useEffect(() => {
    if (!currentTask) return;
    setStatus(currentTask.status);
    setDuration(currentTask.duration?.toString() ?? "");
    setPriority(
      currentTask.priority === Priority.NONE ? "" : (currentTask.priority ?? "")
    );
    setEnergyLevel(currentTask.energyLevel ?? "");
    setDueDate(currentTask.dueDate?.slice(0, 10) ?? "");
  }, [currentTask]);

  useEffect(() => {
    if (currentIndex >= tuneUpTasks.length) {
      setCurrentIndex(Math.max(0, tuneUpTasks.length - 1));
    }
  }, [currentIndex, tuneUpTasks.length]);

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      setTasks(await readJson<TunableTask[]>(response));
      setTasksLoaded(true);
      setTaskError(null);
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Unable to load your tasks."
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (view === "tune-up" && !tasksLoaded) void loadTasks();
    // Loading is intentionally tied to switching into the tune-up view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const createTasks = async (event: FormEvent) => {
    event.preventDefault();
    if (!parsedTasks.length || savingDump) return;

    setSavingDump(true);
    setTaskError(null);
    try {
      const result = await fetch("/api/tasks/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      }).then((response) =>
        readJson<{ tasks: TunableTask[]; count: number }>(response)
      );
      setCreatedCount(result.count);
      setTasks((current) => [...result.tasks, ...current]);
      setDraft("");
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Unable to create tasks."
      );
    } finally {
      setSavingDump(false);
    }
  };

  const saveTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentTask || !duration || !priority || !energyLevel || !dueDate)
      return;

    setSavingTask(true);
    setTaskError(null);
    try {
      const updated = await fetch(`/api/tasks/${currentTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          duration: Number(duration),
          priority,
          energyLevel,
          dueDate,
        }),
      }).then((response) => readJson<TunableTask>(response));

      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task))
      );
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Unable to update this task."
      );
    } finally {
      setSavingTask(false);
    }
  };

  const selectView = (nextView: View) => {
    setView(nextView);
    setTaskError(null);
    setCreatedCount(0);
  };

  return (
    <main className="min-h-full bg-[#fff9e8] p-4 pb-24 text-[#3f432e] sm:p-6 md:pb-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d0902f]">
            <Brain className="h-4 w-4" /> Clear your head
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Brain Dump
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/50">
            Catch every loose thought, turn it into a task, then give each task
            enough detail for Sunnie to plan it well.
          </p>
        </header>

        <div className="mb-5 grid grid-cols-2 rounded-2xl border border-black/[0.06] bg-white/60 p-1.5 shadow-sm sm:inline-grid sm:min-w-[430px]">
          <TabButton
            active={view === "dump"}
            onClick={() => selectView("dump")}
            icon={Inbox}
          >
            Quick dump
          </TabButton>
          <TabButton
            active={view === "tune-up"}
            onClick={() => selectView("tune-up")}
            icon={WandSparkles}
          >
            Task tune-up
          </TabButton>
        </div>

        {taskError && (
          <div className="mb-5 rounded-xl border border-[#efb7a5] bg-[#fff1e8] px-4 py-3 text-sm text-[#8b4934]">
            {taskError}
          </div>
        )}

        {view === "dump" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(270px,0.65fr)]">
            <form
              onSubmit={createTasks}
              className="rounded-3xl border border-black/[0.065] bg-white/75 p-4 shadow-sm sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    What&apos;s on your mind?
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Put one thought on each line. Bullets and numbered lists are
                    welcome too.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#eef3df] px-3 py-1 text-xs font-semibold text-[#617047]">
                  {parsedTasks.length}{" "}
                  {parsedTasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              <textarea
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setCreatedCount(0);
                }}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={
                  "Book dentist appointment\nReply to Maya\nOutline September goals\nPick up cat food"
                }
                className="mt-5 min-h-[300px] w-full resize-y rounded-2xl border border-[#dde4c9] bg-[#fffdf5] p-4 text-base leading-8 outline-none placeholder:text-black/25 focus:border-[#91a96d] focus:ring-4 focus:ring-[#dfe9ca]/50 sm:min-h-[360px]"
                maxLength={16000}
                autoFocus
              />

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-black/38">
                  Your unsaved draft stays in this browser. Ctrl/⌘ + Enter also
                  creates the tasks.
                </p>
                <button
                  type="submit"
                  disabled={!parsedTasks.length || savingDump}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#64734a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#465331] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
                >
                  {savingDump ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Create {parsedTasks.length || ""} tasks
                </button>
              </div>
            </form>

            <aside className="space-y-4">
              {createdCount > 0 && (
                <section className="rounded-2xl border border-[#cddcaf] bg-[#eef3df] p-5 text-[#53633d] shadow-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#84a75e] text-white">
                      <Check className="h-4 w-4" />
                    </span>
                    {createdCount} {createdCount === 1 ? "task" : "tasks"} saved
                  </div>
                  <button
                    onClick={() => selectView("tune-up")}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline decoration-[#9bb57a] underline-offset-4"
                  >
                    Add planning details <ArrowRight className="h-4 w-4" />
                  </button>
                </section>
              )}

              <section className="rounded-2xl border border-black/[0.06] bg-[#fff3cc] p-5 shadow-sm">
                <h2 className="font-semibold">No AI needed yet</h2>
                <p className="mt-2 text-sm leading-6 text-black/52">
                  Sunnie turns each line into a task exactly as you wrote it.
                  That keeps this fast, private, and free. Later, optional AI
                  could split a long messy paragraph or suggest details.
                </p>
              </section>

              <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-5 shadow-sm">
                <h2 className="text-sm font-semibold">After you dump</h2>
                <ol className="mt-3 space-y-3 text-xs leading-5 text-black/48">
                  <li className="flex gap-2">
                    <StepNumber>1</StepNumber>Each line becomes an
                    auto-schedulable task.
                  </li>
                  <li className="flex gap-2">
                    <StepNumber>2</StepNumber>Task Tune-up finds missing
                    planning details.
                  </li>
                  <li className="flex gap-2">
                    <StepNumber>3</StepNumber>Then Plan can place tasks into
                    your day or week.
                  </li>
                </ol>
              </section>
            </aside>
          </div>
        ) : (
          <TaskTuneUp
            tasks={tuneUpTasks}
            currentTask={currentTask}
            currentIndex={currentIndex}
            loading={loadingTasks}
            saving={savingTask}
            status={status}
            duration={duration}
            priority={priority}
            energyLevel={energyLevel}
            dueDate={dueDate}
            onStatusChange={setStatus}
            onDurationChange={setDuration}
            onPriorityChange={setPriority}
            onEnergyChange={setEnergyLevel}
            onDueDateChange={setDueDate}
            onSubmit={saveTask}
            onPrevious={() =>
              setCurrentIndex((index) =>
                index === 0 ? tuneUpTasks.length - 1 : index - 1
              )
            }
            onNext={() =>
              setCurrentIndex((index) => (index + 1) % tuneUpTasks.length)
            }
            onReload={() => void loadTasks()}
          />
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Inbox;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
        active
          ? "bg-[#f8e4a1] text-[#77591d] shadow-sm"
          : "text-[#687052] hover:bg-[#eef3df]"
      )}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f4c85b] text-[10px] font-bold text-[#5a4819]">
      {children}
    </span>
  );
}

type TuneUpProps = {
  tasks: TunableTask[];
  currentTask: TunableTask | null;
  currentIndex: number;
  loading: boolean;
  saving: boolean;
  status: TaskStatus;
  duration: string;
  priority: Priority | "";
  energyLevel: EnergyLevel | "";
  dueDate: string;
  onStatusChange: (value: TaskStatus) => void;
  onDurationChange: (value: string) => void;
  onPriorityChange: (value: Priority | "") => void;
  onEnergyChange: (value: EnergyLevel | "") => void;
  onDueDateChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onPrevious: () => void;
  onNext: () => void;
  onReload: () => void;
};

function TaskTuneUp({
  tasks,
  currentTask,
  currentIndex,
  loading,
  saving,
  status,
  duration,
  priority,
  energyLevel,
  dueDate,
  onStatusChange,
  onDurationChange,
  onPriorityChange,
  onEnergyChange,
  onDueDateChange,
  onSubmit,
  onPrevious,
  onNext,
  onReload,
}: TuneUpProps) {
  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-3xl border border-black/[0.06] bg-white/70">
        <div className="text-center text-sm text-black/45">
          <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#84a75e]" />
          Gathering your unfinished tasks…
        </div>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <section className="grid min-h-[420px] place-items-center rounded-3xl border border-[#cddcaf] bg-[#f4f7e9] p-6 text-center shadow-sm">
        <div className="max-w-md">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dfecc6] text-[#607044]">
            <Check className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold">
            Everything is tuned up!
          </h2>
          <p className="mt-2 text-sm leading-6 text-black/48">
            Every active task has a status, duration, due date, priority, and
            energy level.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              onClick={onReload}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Check again
            </button>
            <Link
              href="/plan"
              className="rounded-xl bg-[#64734a] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Open Plan
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const ready = Boolean(
    duration && Number(duration) > 0 && priority && energyLevel && dueDate
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-3xl border border-black/[0.065] bg-white/80 shadow-[0_14px_50px_rgba(76,79,49,0.09)]"
      >
        <div className="border-b border-black/[0.055] bg-[#fff3cc] px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-black/45">
            <span>
              Task {currentIndex + 1} of {tasks.length}
            </span>
            <span>{tasks.length} need details</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-[#e9ae43] transition-all"
              style={{ width: `${((currentIndex + 1) / tasks.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#84a75e]">
            Tell Sunnie about this task
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl">
            {currentTask.title}
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <TuneField label="Status">
              <select
                value={status}
                onChange={(event) =>
                  onStatusChange(event.target.value as TaskStatus)
                }
                className={selectClassName}
              >
                <option value={TaskStatus.TODO}>To do</option>
                <option value={TaskStatus.IN_PROGRESS}>In progress</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
              </select>
            </TuneField>
            <TuneField label="Time estimate" icon={Clock3}>
              <select
                value={duration}
                onChange={(event) => onDurationChange(event.target.value)}
                className={selectClassName}
              >
                <option value="">Choose duration</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
              </select>
            </TuneField>
            <TuneField label="Priority">
              <select
                value={priority}
                onChange={(event) =>
                  onPriorityChange(event.target.value as Priority | "")
                }
                className={selectClassName}
              >
                <option value="">Choose priority</option>
                <option value={Priority.HIGH}>High</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.LOW}>Low</option>
              </select>
            </TuneField>
            <TuneField label="Energy needed">
              <select
                value={energyLevel}
                onChange={(event) =>
                  onEnergyChange(event.target.value as EnergyLevel | "")
                }
                className={selectClassName}
              >
                <option value="">Choose energy</option>
                <option value={EnergyLevel.HIGH}>High energy</option>
                <option value={EnergyLevel.MEDIUM}>Medium energy</option>
                <option value={EnergyLevel.LOW}>Low energy</option>
              </select>
            </TuneField>
            <TuneField label="Due date" icon={CalendarDays}>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => onDueDateChange(event.target.value)}
                className={selectClassName}
              />
            </TuneField>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={onPrevious}
                aria-label="Previous task"
                className="grid h-11 w-11 place-items-center rounded-xl border border-black/10 bg-white text-black/50 hover:bg-[#eef3df]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-black/55 hover:bg-[#eef3df]"
              >
                Skip for now <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!ready || saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#64734a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#465331] disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}{" "}
              Save &amp; next
            </button>
          </div>
        </div>
      </form>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-black/[0.06] bg-[#eef3df] p-5 shadow-sm">
          <h3 className="font-semibold">What counts as untuned?</h3>
          <p className="mt-2 text-sm leading-6 text-black/50">
            Any active task missing a duration, due date, priority, or energy
            level appears here. Status is included on every card so you can
            update it too.
          </p>
        </section>
        <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-5 shadow-sm">
          <h3 className="font-semibold">All tasks included</h3>
          <p className="mt-2 text-sm leading-6 text-black/50">
            This cycles through tasks from everywhere in Sunnie—not only tasks
            made in Brain Dump.
          </p>
        </section>
      </aside>
    </div>
  );
}

function TuneField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Clock3;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-black/62">
      <span className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      {children}
    </label>
  );
}
